---
title: "Stop Writing Action URLs: Design REST Around Resources"
description: >-
  Action URLs like /approve-order feel convenient until your endpoint list explodes. Here's the
  mental model — nouns, not verbs — for finding your resources and designing URLs that stay clean
  as the system grows.
tags: [system-design, api-design, rest-api]
draft: false
author: mxpadidar
publishedAt: 2026-06-28
heroImage: ../assets/hero-images/rest-resources-vs-actions.png
---

A REST API can start clean and still become messy surprisingly fast.

It often begins with a few harmless-looking endpoints:

```text
/approve-order
/cancel-subscription
/process-payment
```

Then the product grows.

Soon you have:

```text
/reject-order
/reopen-order
/retry-payment
/pause-subscription
/resume-subscription
```

At that point, the problem isn't really the number of endpoints.

It's the way the API was designed.

Instead of asking:

> "What endpoint should I create for this action?"

a better question is:

> **"What resource is the client interacting with?"**

That small change in thinking can make REST API design much simpler.

## What Is a Resource?

In REST, a resource is a meaningful concept in your domain that can be identified and represented.

Examples include:

- User
- Order
- Invoice
- Payment
- Approval
- Subscription

A resource is not necessarily a database table, and it isn't an API action.

A useful test is to ask:

- Does it have an identity?
- Can I retrieve its current state?
- Can that state change over time?

If yes, it is probably a resource.

For example, an order might look like:

```json
{
  "id": 123,
  "status": "pending",
  "total": 149.9
}
```

The important part is that the order exists independently of the operations performed on it.

## URLs Should Identify Things

Once the resource is clear, the URL usually becomes obvious.

```text
/orders/123
/users/42
/payments/987
```

A URL should answer:

> **"What resource is this?"**

Not:

> "What should the server do?"

HTTP methods already describe the operation.

The resource stays the same.

Only the intent changes.

## Collections and Individual Resources

Collections represent multiple resources:

```text
/orders
/users
/payments
```

Typical operations:

```text
GET  /orders
POST /orders
```

Individual resources use an identifier:

```text
/orders/{id}
```

For example:

```text
GET    /orders/123
PATCH  /orders/123
DELETE /orders/123
```

This consistency is valuable.

If a developer understands `/orders/{id}`, they can probably predict how `/users/{id}` behaves too.

**Predictability is a feature.**

## Resources vs Actions

One of the most common REST mistakes is turning business actions directly into URLs.

For example:

```text
POST /cancel-order
```

or:

```text
POST /orders/123/cancel
```

But cancelling an order is often just a change in its state.

Instead:

```http
PATCH /orders/123
```

```json
{
  "status": "cancelled"
}
```

The client requests the desired state.

The backend decides whether that transition is allowed.

Maybe the order has already shipped.

Maybe the user doesn't have permission.

Maybe cancelled orders cannot be reopened.

Those are business rules, and they belong on the server.

## Think in State Transitions

Many things that sound like actions are really state changes.

Take a subscription:

```json
{
  "id": 42,
  "status": "active"
}
```

Pausing it is not a new operation — it is a state transition:

```json
{
  "id": 42,
  "status": "paused"
}
```

Instead of immediately creating:

```text
/pause-subscription
/resume-subscription
/cancel-subscription
```

ask:

> **"What states can this resource have, and which transitions are valid?"**

That question often leads to a cleaner API.

## How to Discover Resources

When designing a feature, don't start by listing endpoints.

Start by listing the important nouns in the domain.

For an ordering system, you might have:

```text
User
Order
OrderItem
Payment
Shipment
Refund
```

Then ask:

1. Does it have its own lifecycle?
2. Can clients identify or reference it?
3. Would we query, modify, link to, or audit it independently?

If yes, it probably deserves to be a resource.

Only after that should you design the URLs.

## Keep URLs Boring

Good REST URLs are usually boring.

That's a good thing.

```text
/orders
/orders/{id}
/orders/{id}/items
/users/{id}/subscriptions
/payments/{id}
```

Avoid URLs like:

```text
/get-orders
/process-payment
/update-user-status
/approve-order
```

A few rules cover most cases:

- Use nouns instead of verbs.
- Use plural names for collections.
- Keep resource identifiers stable.
- Use query parameters for filtering.
- Avoid encoding workflows into URLs.

For example, don't do:

```text
/orders/pending
/orders/approved
```

Prefer:

```text
GET /orders?status=pending
```

An order's state can change.

Its identity should not.

## The Backend Still Owns the Rules

Resource-based design doesn't mean clients can change anything they want.

The client might request:

```http
PATCH /orders/123
```

```json
{
  "status": "cancelled"
}
```

But the backend still owns:

- authorization
- validation
- business rules
- valid state transitions
- side effects

The client expresses intent.

The server decides whether that intent is valid.

## The Question That Prevents Bad Endpoints

Before adding an endpoint like:

```text
POST /approve-order
```

ask:

> **"What resource is actually changing?"**

Then ask:

> **"Is this really a new operation, or just a state transition?"**

Those two questions can prevent a lot of unnecessary API complexity.

The resource-first mental model is simple:

```text
Domain
  ↓
Resources
  ↓
State
  ↓
URLs
  ↓
HTTP methods
```

Not:

```text
Action
  ↓
New endpoint
  ↓
Another action
  ↓
Another endpoint
```

Find the important things in your domain.

Give them stable identities.

Represent their state.

Use HTTP methods to express intent.

When the resource model is clear, the API usually becomes clear too.
