---
title: "Your Message Was Never Published: Fixing the Dual-Write Problem with the Outbox Pattern"
description: >-
  Your database commit succeeds, but the event never reaches the broker. Here's how the Outbox
  Pattern turns silent message loss into a recoverable moment.
tags: [design-patterns, distributed-systems, system-design, event-driven]
draft: false
author: mxpadidar
publishedAt: 2026-08-16
heroImage: ../assets/hero-images/outbox-pattern.png
---

Distributed systems rarely fail because RabbitMQ goes down.

They fail because your code assumes two independent operations will always succeed together.

Take an e-commerce checkout. When a customer places an order, your service does two things:

1. Save the order to the database.
2. Publish an `OrderCreated` event so other services can reserve inventory, charge payments,
   and send confirmation emails.

The obvious code looks innocent:

```python
save_order(order)

rabbitmq.publish(OrderCreated(order.id))
```

It works perfectly on your laptop. It passes every integration test.

Then production happens.

## The dual-write problem

Picture this timeline:

```text
Save order to PostgreSQL        ✓ Success

Publish OrderCreated             ✗ RabbitMQ is temporarily down
```

The database holds the order. No other service knows it exists. Inventory sits unreserved. The
customer waits. Support receives a ticket.

The systems are all healthy again, but your data has already drifted. The two writes — to the
database and to the broker — were never part of a single atomic transaction. One can succeed
while the other fails.

This is the **dual-write problem**. It's not a bug in RabbitMQ. It's a design bug in how we
connect our business logic to the messaging infrastructure.

## "Just publish first" doesn't help

Some people suggest reversing the order:

```text
Publish event    ✓ Success

Save order       ✗ Database failure
```

Now downstream services react to an event for an order that was never committed. Maybe they
deduct inventory for a ghost. The inconsistency simply moves to the other side.

Neither ordering solves the fundamental issue: two separate systems, two separate writes, no
shared transaction.

## The Outbox Pattern: treat events as data

The Outbox Pattern changes one simple rule:

> Don't publish messages inside your business transaction. Write them to a database table
> instead.

Imagine these two tables:

```text
orders
  id
  customer_id
  total

outbox_events
  id
  event_type
  payload
  status        (pending, published)
  created_at
```

When an order is created, both inserts happen inside the **same database transaction**:

```sql
BEGIN;

INSERT INTO orders (...);

INSERT INTO outbox_events (
    event_type,
    payload,
    status
) VALUES (
    'OrderCreated',
    '{"order_id": 123}',
    'pending'
);

COMMIT;
```

No RabbitMQ call anywhere. Just two ordinary database writes. Because they share a transaction,
they either both land on disk or neither does. Atomicity is guaranteed by the database itself.

## Publishing happens later, reliably

A separate background worker continuously polls the `outbox_events` table:

```sql
SELECT *
FROM outbox_events
WHERE status = 'pending'
ORDER BY created_at
LIMIT 100;
```

For each pending event, it does:

```text
Publish to RabbitMQ  →  Success?  →  Mark status = 'published'
                      ↘  Failure?  →  Leave status = 'pending' for next poll
```

If RabbitMQ is down for 5 seconds or 5 minutes, nothing is lost. The event sits safely in the
database and will be retried until the broker accepts it.

Your database is now the source of truth. RabbitMQ becomes a projection of committed business
events — a reliable log that can be replayed if necessary.

## But won't that cause duplicate messages?

Yes. And that's why consumers must be **idempotent**.

RabbitMQ offers at-least-once delivery. A consumer might process an event successfully but crash
before acknowledging it. The broker redelivers. Without protection, you could reserve inventory
twice.

The fix is an **inbox** — a simple table of processed event IDs:

```text
processed_events
  event_id
  processed_at
```

Every consumer follows this flow:

```text
Receive event
  │
  ▼
Check processed_events   →  already processed?  →  Ignore
  │
  ▼
Execute business logic
  │
  ▼
INSERT into processed_events
  │
  ▼
Acknowledge message
```

This makes message handling safe to retry, even if the same event arrives multiple times.

## The pattern doesn't eliminate failures — it makes them recoverable

One common misunderstanding: "The Outbox Pattern prevents failures."

It doesn't.

RabbitMQ can still go offline. Workers can still crash. Networks can still partition. What the
Outbox Pattern changes is that failures no longer mean lost business events.

A lost database transaction is automatically rolled back. A lost publication will be retried.
The system drifts into consistency instead of drifting into chaos.

## Production-grade details matter

Many tutorials stop after explaining the outbox table. Real systems need more. A robust
implementation usually includes:

- **Retry policies** for failed publishes (exponential backoff, dead-letter queues)
- **Ordering guarantees** — publish events in `created_at` order to avoid causal confusion
- **Batching** — poll and publish multiple events per cycle for higher throughput
- **Multiple publisher instances** — use `SELECT ... FOR UPDATE SKIP LOCKED` so workers don't
  step on each other
- **Monitoring** — alert if the pending count grows, if the lag increases, or if a message is
  stuck
- **Cleanup** — archive or delete old published events to keep the table lean
- **Event versioning** — change payload structure? Make it backward-compatible or versioned

The pattern is conceptually simple. Operating it reliably is where engineering begins.

## Is it worth the extra table and worker?

If your service is a monolith with only synchronous REST calls, probably not.

If your service writes to a database _and_ publishes events to Kafka, RabbitMQ, Azure Service
Bus, or any other broker, the answer is almost always **yes**.

The Outbox Pattern trades one of the hardest classes of distributed bugs — silent message loss —
for a small amount of infrastructure that you control and can monitor. A background worker can be
restarted. A lost business event usually cannot.

## Final thoughts

The Outbox Pattern isn't about RabbitMQ. It isn't about Kafka. It's about acknowledging a
fundamental truth of distributed systems:

> Two independent writes will eventually diverge.

Instead of pretending they won't, the pattern gives your system a reliable way to recover when
they do. That's why years after its introduction, it remains one of the most widely adopted
patterns in event-driven architectures — and why it's still the default choice for services that
need to publish events reliably.
