---
title: "Duplication Is Better Than the Wrong Abstraction"
description: >-
  Sharing code that needs to change for different reasons can make simple changes harder.
  Learn when to keep similar code separate and when a shared abstraction helps.
tags: ["clean-code", "design-patterns", "refactoring"]
draft: false
author: mxpadidar
publishedAt: 2026-10-02
heroImage: "../assets/hero-images/duplication-over-wrong-abstraction.png"
---

DRY stands for “Don’t Repeat Yourself.” When the same rule appears in several places, we have to
update every copy when it changes. Miss one, and different parts of the application follow different
rules.

The [DRY definition](https://pip.pragprog.com/tips/) is about keeping each rule or fact in one
place. Similar code may follow different rules, while different code may follow the same rule.

Before combining code, we need to understand what it does and why it might change. Here are four
situations where keeping similar code separate can make changes easier.

## The Code Looks the Same, but the Rules Are Different

A store offers free shipping and a promotional discount on orders of $100 or more. Both use the same
subtotal in USD:

```python
from decimal import Decimal


def qualifies_for_free_shipping(subtotal: Decimal) -> bool:
    return subtotal >= Decimal("100.00")


def qualifies_for_discount(subtotal: Decimal) -> bool:
    return subtotal >= Decimal("100.00")
```

We could replace both with `qualifies_for_benefits()`. But when shipping costs rise and free
shipping starts at $150, the discount should still start at $100. Now we have to split the function
we just created.

Those amounts happened to match. They belonged to separate business decisions.

Keep rules separate when they can change for different reasons, even if their code is the same
today. If the business defines one minimum amount for both benefits, sharing it makes sense.

## The Shared Interface Promises Too Much

Imagine two payment processors. One can reserve money now with `authorize()` and collect it later
with `capture()`. The other takes payment immediately through `charge()`.

Both checkout workflows validate the amount and record the payment result. We want to remove those
repeated steps, so we try to share the whole workflow.

We give both processors an interface with `authorize()` and `capture()`. But the immediate-charge
processor cannot reserve money. Its `authorize()` method ends up raising `NotImplementedError`, so
checkout starts checking which processor it received:

```python
if isinstance(processor, ImmediateChargeProcessor):
    processor.charge(amount)
else:
    authorization_id = processor.authorize(amount)
    processor.capture(authorization_id)
```

The interface was supposed to let checkout use either processor. Checkout still needs to know which
operations each one supports. A workflow that needs to collect the money later cannot use the
immediate-charge processor at all.

Keeping the checkout workflows separate may mean repeating calls to validate the amount and record
the result. That can be easier to maintain than a shared workflow that checks the processor type.

Both workflows can call the same validation function. Repeating that call doesn't duplicate the
validation rule.

An interface for immediate payment might work for both processors. An interface for reserving money
doesn't. Share the operations that both processors can actually support.

## The Shared Function Needs to Know Who Called It

Welcome emails and invoice emails share some formatting, so we create a shared function that builds
them. Then invoices need payment details, welcome emails need an offer, and overdue invoices need a
different message.

Soon, callers look like this:

```python
render_email(
    customer=customer,
    is_invoice=True,
    show_payment_details=True,
    include_welcome_offer=False,
    is_overdue=False,
)
```

Suppose both emails put their main content below the greeting. Now invoices need the amount due
above it. Changing the shared layout could move the welcome offer too, so we add another
invoice-specific condition.

An invoice change now requires checking welcome emails. Each small request adds another option to
the shared function.

Keep workflows separate when changing one requires understanding and checking the others. Here,
`render_welcome_email()` and `render_invoice_email()` can still share a footer or base template
without putting both workflows in one function.

Options are useful when they describe different ways to perform the same operation. Be more careful
when they keep growing just to handle separate workflows.

## The Helper Only Wraps Another Call

We use the same library call in a few places, so we move it into a helper:

```python
def get_record(record_id, filters):
    return storage.get_record(record_id, filters)
```

The callers still pass the same arguments and handle the same result. To find out what the helper
does, we open it and find the library call we could have written directly.

Calling the same API in several places doesn't necessarily repeat a rule we own. The library already
provides a way to get a record. This helper gives that operation another name.

A wrapper can still be useful. It might apply a shared rule, handle errors in one place, or give us
one place to replace a library or use a substitute during tests.

If we don't need a separate interface around this library, the helper only adds another function to
read and maintain.

## Before Removing the Duplication

Ask what would make each copy change. If the answer is different for each one, combining them may
create more work.

Also look at the callers. Does the shared code make their job easier? Or do they now need extra
flags, checks for supported operations, and knowledge of other workflows?

Keeping copies of the same business rule still has a cost: we might fix one copy and forget another.
But matching lines alone aren't enough reason to put code in one place.

If a shared abstraction is already making simple changes harder, we can split it. The repeated code
may be easier to maintain.
