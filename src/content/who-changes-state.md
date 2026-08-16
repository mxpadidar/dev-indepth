---
title: "Commands, Events, and Who Owns the State Change"
description: >-
  Event handlers can change state, but not every state change belongs there.
  A practical way to decide what belongs in a command handler, event handler, or CQRS projection.
tags: [system-design, cqrs, event-driven]
draft: false
author: mxpadidar
publishedAt: 2026-08-09
heroImage: ../assets/hero-images/who-changes-state.png
---

You're building an event-driven application.

A command comes in, something changes, and an event is published.

Then comes a deceptively simple question:

> **Should the event handler change state, or should it only react to what already happened?**

A common answer is:

> Commands change state. Events only notify.

That rule is useful at first, but it breaks down quickly.

Event handlers often do change state.

A CQRS projection updates a read model. A fulfillment service may create a shipment after receiving
`PaymentReceived`. A cache handler may update stored data.

So the better question is:

> **Whose state is being changed, and who owns that decision?**

That distinction is much more useful.

## Commands Ask. Events Tell.

The simplest mental model starts here.

**Commands represent intent.**

```text
CreateOrder
UpdateUserProfile
CancelSubscription
```

A command says:

> "Please do this."

Because it is a request, the system can reject it.

Maybe the order is invalid.

Maybe the user doesn't have permission.

Maybe the subscription cannot be cancelled.

**Events represent facts.**

```text
OrderCreated
UserProfileUpdated
SubscriptionCanceled
```

An event says:

> "This happened."

A consumer might fail to process that event. It might retry it, ignore it, or move it to a
dead-letter queue.

But it does not get to retroactively reject the fact that the producer already declared.

That difference matters when deciding where business state should change.

## The Command Owns the Original Business Decision

Suppose we're creating an order.

The command handler receives the request, validates it, decides whether the operation is allowed,
and changes the order state.

```python
async def handle_create_order(command):
    if not command.items:
        raise ValidationError("Order must have items")

    total = calculate_total(command.items)
    status = "review" if total > 10_000 else "pending"

    order = Order(
        id=generate_id(),
        customer_id=command.customer_id,
        items=command.items,
        total=total,
        status=status,
    )

    await order_repository.save(order)

    publish_event(
        OrderCreated(
            order_id=order.id,
            customer_id=order.customer_id,
            total=order.total,
            status=order.status,
        )
    )

    return order
```

The important part is that the decision is already complete before `OrderCreated` is published.

The system has decided:

- whether the order can be created
- what its total is
- what its initial status should be

The event describes the result.

It does not finish deciding what creating the order means.

## Don't Finish the Original Operation in an Event Handler

Now imagine we did this instead:

```python
async def handle_order_created(event) -> None:
    if event.total > 10_000:
        await order_repository.update_status(
            event.order_id,
            "review",
        )
```

At first glance, this may look nicely decoupled.

But if `review` is part of the order creation rule, we've split one business decision across two
different places.

The order is first created.

Then later, if the handler runs successfully, its real status is decided.

That creates an uncomfortable question:

> **Was the order actually created correctly before this handler ran?**

If the answer is no, then this probably wasn't a separate reaction.

It was part of the original business operation.

That logic belongs closer to the command that owns that operation.

## Event Handlers Can Still Change State

This does **not** mean event handlers should never modify state.

Consider two different bounded contexts:

```text
Payment Service
      |
      | PaymentReceived
      v
Fulfillment Service
```

The payment service records a successful payment and publishes:

```text
PaymentReceived
```

The fulfillment service consumes that event:

```python
async def handle_payment_received(event):
    shipment = Shipment(
        order_id=event.order_id,
        status="pending",
    )

    await shipment_repository.save(shipment)
```

That handler is clearly changing business state.

And that's fine.

The important difference is that it is changing **fulfillment state**, which belongs to the
fulfillment service.

It is not secretly finishing the payment operation.

A useful mental model is:

```text
Command
   ↓
One boundary makes a business decision
   ↓
Its state changes
   ↓
Event
   ↓
Another boundary reacts
   ↓
That boundary may change its own state
```

Events can trigger state changes.

They just shouldn't hide ownership of the original business decision.

## CQRS Read Models Are Another Clear Example

CQRS makes this distinction especially visible because it separates the write side from the read
side.

```text
Write Model → optimized for commands
Read Model  → optimized for queries
```

Suppose a command updates a product:

```python
async def handle_update_product(command) -> Product:
    product = await product_repository.get(command.product_id)
    product.update(name=command.name, price=command.price)
    await product_repository.save(product)

    publish_event(
        ProductUpdated(
            product_id=product.id,
            name=product.name,
            price=product.price,
        )
    )

    return product
```

An event handler can then update the search model:

```python
async def update_product_search_index(event) -> None:
    await search_index.update({
        "id": event.product_id,
        "name": event.name,
        "price": event.price,
    })
```

That is absolutely a state change.

But it is not changing the authoritative product state.

It is updating a projection.

The write model has already made the business decision.

The read model catches up afterward.

That's one of the normal forms of eventual consistency in CQRS.

## The Consistency Test

When you're unsure whether a state change belongs in an event handler, ask:

> **If this handler fails temporarily, is the system still valid while it is retried?**

This test catches many design mistakes.

### Welcome Email

A user registers successfully.

Then the welcome-email handler fails.

```text
User saved       ✅
Welcome email    ❌
```

Is the user account still valid?

Yes.

The email can be retried later.

That's a good asynchronous responsibility.

### Search Projection

A product is updated.

The search-index handler fails.

```text
Product database    ✅
Search index        ❌
```

The search result may temporarily be stale.

But the authoritative product state is still correct.

The projection can catch up later.

Again, this is a normal event-handler responsibility.

### Critical State

Now imagine two changes that belong to the same operation:

```text
Payment recorded       ✅
Order marked as paid   ❌
```

If both changes belong to the same consistency boundary and the operation is only valid when both
happen together, splitting them across asynchronous handlers is suspicious.

But if payment and order belong to separate services, temporary inconsistency may be intentional.

In that case the question changes.

Now you care about:

- retries
- idempotency
- observability
- recovery
- eventual consistency

The system does not need every component to update at the exact same moment.

It needs a reliable path toward the correct state.

## Event Handlers Must Expect Retries

Once work happens asynchronously, retries are part of the design.

A consumer can:

1. Receive an event.
2. Complete the work.
3. Crash before acknowledging the message.
4. Receive the same event again.

So handlers should generally be designed to safely process duplicate delivery.

For a projection, that might be straightforward:

```python
async def update_product_search_index(event) -> None:
    await search_index.upsert(
        id=event.product_id,
        name=event.name,
        price=event.price,
    )
```

Processing the same update twice produces the same final result.

External side effects can be harder.

If an email provider or payment API supports idempotency keys, using the event ID as that key can
help avoid duplicate operations.

The important point is simple:

> **If an event handler changes state, assume it may run more than once.**

## A Note About Event Sourcing

Event Sourcing changes the role of events.

In a typical event-driven application, the current database state is authoritative and events
describe what happened.

In an Event-Sourced system, the events themselves are persisted as the source of truth.

Conceptually:

```text
Command
   ↓
Validate against current aggregate
   ↓
Produce events
   ↓
Persist events
   ↓
Derive new state
```

So the question of "whether events should change state" has a different answer there.

Events are part of how the state is represented in the first place.

That's why it's useful not to mix ordinary event-driven architecture with Event Sourcing when
reasoning about this problem.

## A Practical Rule

Instead of memorizing:

> "Commands change state. Events don't."

Use this model:

```text
Command Handler
├── validates the request
├── makes the original business decision
├── changes state it owns
└── publishes the resulting fact

Event Handler
├── reacts to that fact
├── performs side effects
├── updates projections
└── may change state owned by another boundary
```

Then ask three questions:

> **Whose state is this?**

> **Who owns the decision that changes it?**

> **If this handler fails temporarily, can the system recover safely?**

Those questions are more useful than deciding based only on whether a function is called a
"command handler" or an "event handler."

## Conclusion

Events are not limited to notifications.

They can update projections, trigger workflows, and cause other parts of the system to change their
own state.

The important boundary is ownership.

A command should usually complete the business decision it owns before announcing the result.

An event handler should react to that completed fact, not secretly finish the operation that was
supposed to have already succeeded.

So when you're deciding where a state change belongs, don't ask:

> **"Can an event handler change state?"**

Ask:

> **"Is this handler reacting to a completed fact, or is it finishing a decision that belongs
> somewhere else?"**

That distinction keeps event-driven systems much easier to reason about.
