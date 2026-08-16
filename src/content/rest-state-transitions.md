---
title: "REST for Workflows: State Transitions Are Updates, Not Endpoints"
description: >-
  Approving, rejecting, escalating — none of these deserve their own endpoint. How to model
  workflow state transitions as PATCH updates with domain-validated rules.
tags: [api-design, rest-api]
draft: false
author: mxpadidar
publishedAt: 2026-07-05
heroImage: ../assets/hero-images/rest-state-transitions.png
---

A fee request sits in your queue. Your manager opens it, clicks approve, and a few seconds later
the record shows `APPROVED`.

Behind that click, somewhere, an API endpoint did something.

The interesting question is **what that endpoint looks like** — because workflow-driven systems
tend to answer it the same wrong way every time.

## The Two Ways to Model a Transition

When a manager approves a fee request, two designs are possible:

```text
POST /resources/123/approve        # action-based
PATCH /resources/123               # state-based
```

The first one feels natural.

The second one is the REST answer.

**Approving is not a command to the resource. It is a change to the resource's state.**

## State Is Part of the Resource

A resource that participates in a workflow should expose its current state explicitly.

A fee request has a lifecycle:

```text
PENDING
  ├── APPROVED
  └── REJECTED
```

A manager decision moves the resource from one valid state to another.

It does not create a new resource.

It updates the existing one.

## PATCH, Not POST

When a client changes only part of a resource — such as its status — the correct HTTP method is
`PATCH`.

`PATCH` communicates intent clearly:

- The resource already exists
- Only specific fields are being modified
- The update may be conditional or validated by domain rules

That aligns naturally with workflow transitions.

## The Endpoint Stays the Same

```text
PATCH /resources/{id}
```

The request body expresses _what the new state should be_, not _what action to execute_.

Approving:

```json
{
  "status": "approved",
  "comment": "Approved within budget"
}
```

Rejecting:

```json
{
  "status": "rejected",
  "comment": "Exceeds allowed limit"
}
```

Two different decisions.

One endpoint.

**The URL doesn't grow. The state machine does.**

## Business Rules Stay Server-Side

REST does not remove business rules — it clarifies where they belong.

Typical rules enforced server-side:

- Only specific transitions are allowed (e.g. `PENDING` → `APPROVED`)
- Some transitions require additional data (e.g. a rejection comment)
- Once a terminal state is reached, further updates are rejected

The API surface stays stable while the domain controls correctness.

## Why Action Endpoints Are a Trap

Endpoints like:

```text
POST /approve
POST /reject
POST /resources/{id}/approve
```

introduce long-term problems:

- URLs encode behavior instead of resource state
- Each new action creates a new endpoint
- Workflows become fragmented and harder to reason about
- Clients must learn verbs instead of resource models

These designs start simple and scale poorly.

## The Payoff: New Transitions Without New Endpoints

Business rules change.

Your approval workflow grows:

```text
PENDING
  ├── APPROVED
  ├── REJECTED
  ├── ESCALATED
  ├── CANCELLED
  └── EXPIRED
```

Every one of these transitions works through the same endpoint and the same method.

No new URLs.

No client changes.

The domain simply decides which transitions are valid — and that's exactly where those rules
belong.

## Summary

State transitions are a natural fit for REST when they are modeled as **updates to existing
resources**.

Use `PATCH` with explicit state fields, and let the domain enforce the rules.

That keeps APIs resource-oriented, prevents endpoint proliferation, and centralizes business
logic where it can actually be tested.

The fee approval scenario demonstrates the pattern, but the approach applies to any
workflow-driven RESTful system.
