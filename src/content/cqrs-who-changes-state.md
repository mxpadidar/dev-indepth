---
title: "CQRS: Should Event Handlers Change State?"
description: >-
  Put state changes in the wrong CQRS handler and debugging becomes a nightmare. A practical test
  for deciding whether a command or an event handler should own the change.
tags: [system-design, cqrs, event-driven, distributed-systems]
draft: false
author: mxpadidar
publishedAt: 2026-08-09
heroImage: ../assets/hero-images/cqrs-who-changes-state.png
---

You're building a CQRS application.

A command comes in, something changes, and an event is published.

Then comes a deceptively simple question:

> **Should the event handler change application state, or should it only react to what already
> happened?**

Put state changes in the wrong place and things can get messy quickly.

Business logic becomes scattered across handlers. Transaction boundaries become unclear. An
event handler fails halfway through, and suddenly part of the system believes something happened
while another part doesn't.

The answer becomes much clearer once you separate **commands**, **events**, and the state they
are responsible for.

## Commands Ask. Events Tell.

The simplest mental model is this:

**Commands represent intent.**

```text
CreateOrder
UpdateUserProfile
CancelSubscription
```

A command says:

> "Please do this."

Because it is only a request, the system can reject it.

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

> "This already happened."

You don't reject an event after the fact.

That distinction gives us an important architectural question:

> **Where should the actual state change happen?**

There are two common approaches.

## Approach 1: The Command Changes State

For most CQRS applications, this is the simpler model.

The command handler:

1. receives the command
2. validates business rules
3. changes the write model
4. saves the change
5. publishes an event

For example:

```python
async def handle_create_order(command):
    if not command.items:
        raise ValidationError("Order must have items")

    order = Order(
        id=generate_id(),
        customer_id=command.customer_id,
        items=command.items,
        status="pending",
    )

    # Core state change
    await order_repository.save(order)

    # Tell the rest of the system what happened
    publish_event(OrderCreated(
        order_id=order.id,
        customer_id=order.customer_id,
    ))

    return order
```

The event handlers can then react:

```python
async def send_confirmation(event):
    await email_service.send_order_confirmation(
        event.customer_id,
        event.order_id,
    )
```

Maybe another handler updates analytics.

Another invalidates a cache.

Another notifies a different service.

The important part is this:

> **The order already exists before those handlers run.**

If the confirmation email fails, the order does not disappear.

The core business operation already succeeded.

## Why This Model Is Usually Easier

Keeping write-model changes inside command handlers gives you a clear transaction boundary.

The flow is easy to reason about:

```text
Command
   ↓
Validate
   ↓
Change state
   ↓
Save
   ↓
Publish event
   ↓
React
```

Your business rules stay close to the operation that can actually reject them.

Your event handlers don't secretly determine whether the original command succeeded.

And debugging becomes much more linear.

This is generally the better default when you're using **CQRS without Event Sourcing**.

## Approach 2: Events Drive State

There is another model.

Instead of changing state directly, the command validates the request and produces an event.

The event then becomes the foundation for deriving state.

Conceptually:

```text
Command
   ↓
Validate
   ↓
Event
   ↓
State derived from events
```

This is especially relevant in **Event Sourcing**.

Rather than treating the current database row as the ultimate source of truth, the system stores
the sequence of events that produced the current state.

For example:

```text
AccountOpened
MoneyDeposited
MoneyTransferred
MoneyWithdrawn
```

The current account state can be reconstructed from that history.

In this architecture, events aren't simply notifications about the write model.

They are part of how the state itself is represented.

That's a very different responsibility from ordinary event-driven side effects.

## The Important Exception: Read Models

There is one place where event handlers commonly **should** change state even when command
handlers own the write model:

**CQRS read models.**

CQRS separates the application into two sides:

```text
Write Model → optimized for commands
Read Model  → optimized for queries
```

Suppose a command updates a product:

```python
async def handle_update_product(command):
    product = await product_repository.get(command.product_id)

    product.update(
        name=command.name,
        price=command.price,
    )

    # Write model changes here
    await product_repository.save(product)

    publish_event(ProductUpdated(
        product_id=product.id,
        name=product.name,
        price=product.price,
    ))
```

An event handler can then update a search index:

```python
async def update_product_search_index(event):
    await search_index.update({
        "id": event.product_id,
        "name": event.name,
        "price": event.price,
    })
```

That is still a state change.

But it is a change to the **read model**, not the authoritative write model.

That's exactly what projections are supposed to do.

The write model is already valid.

The read model catches up from the emitted events.

## The Consistency Test

When you're unsure where a state change belongs, ask one question:

> **If the command succeeds but this event handler fails, is the system still in a valid state?**

This is a surprisingly useful test.

### Example: Welcome Email

A user registers successfully.

The user is saved.

Then the event handler responsible for sending the welcome email fails.

```text
User saved       ✅
Welcome email    ❌
```

Is the system still valid?

**Yes.**

The user can still log in.

The email is a side effect that can be retried later.

That's a good event-handler responsibility.

### Example: Critical Business State

Now imagine:

```text
Payment recorded       ✅
Order marked as paid   ❌
```

Is the system still valid?

Probably not.

You now have two pieces of critical business state disagreeing with each other.

That should make you question whether the second operation really belongs in an independent
event handler.

## Don't Scatter Business Logic Across Events

One of the easiest CQRS mistakes is putting decisions inside event handlers.

For example:

```python
async def handle_order_created(event):
    if event.total > 10000:
        await order_repository.update_status(
            event.order_id,
            "review",
        )
```

Now the order's actual business state depends on something that happens **after** `OrderCreated`.

A better approach is to decide the state while processing the command:

```python
async def handle_create_order(command):
    total = calculate_total(command.items)

    status = "review" if total > 10000 else "pending"

    order = Order(
        id=generate_id(),
        items=command.items,
        total=total,
        status=status,
    )

    await order_repository.save(order)
```

The command handler is where business rules can still say:

> "No, this operation isn't valid."

Once the event exists, you're describing something that has already happened.

## Event Handlers Should Be Safe to Retry

Event-driven systems eventually encounter retries.

A message might be delivered twice.

A consumer might crash after completing its work but before acknowledging the message.

An event might be replayed.

That means handlers should generally be **idempotent**.

Running the same handler twice should not accidentally perform the side effect twice.

For example:

```python
async def send_welcome_email(event):
    if await email_log.exists(event.user_id, "welcome"):
        return

    await email_service.send_welcome(event.user_id)

    await email_log.record(
        event.user_id,
        "welcome",
    )
```

This becomes especially important as events start updating caches, projections, search indexes,
or external systems.

## A Practical Rule of Thumb

You don't need to memorize dozens of CQRS rules.

Start with this:

### In a typical CQRS application

```text
Command Handler
├── validates business rules
├── changes the write model
├── saves critical state
└── publishes events

Event Handler
├── sends notifications
├── calls external systems
├── updates analytics
├── invalidates caches
└── updates read models
```

### In an Event-Sourced system

```text
Command
   ↓
Validation
   ↓
Events
   ↓
Event history
   ↓
Derived state
```

The architecture is different because events play a different role.

## The Question to Ask Before Every Handler

When you're about to write an event handler that modifies something, ask:

> **"If this handler never runs, did the original business operation still succeed correctly?"**

If the answer is **yes**, you're probably dealing with a side effect or projection.

If the answer is **no**, the handler may be responsible for critical business state that belongs
closer to the command—or you may intentionally be working in an Event-Sourced architecture.

That distinction matters more than whether a function happens to be called an "event handler."

The mental model to keep is simple:

> **Commands tell the system what you want to happen. Events tell the system what already
> happened.**

Keep that boundary clear, and CQRS becomes much easier to reason about.
