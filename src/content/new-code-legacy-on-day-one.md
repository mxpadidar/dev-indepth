---
title: "How New Code Becomes Legacy on Day One"
description: >-
  A small feature can make old design problems harder to fix. Follow a customer credit-limit
  example to see when a new model helps—and when it just adds more work.
tags: [refactoring, system-design, clean-code]
draft: false
author: mxpadidar
publishedAt: 2026-09-17
heroImage: ../assets/hero-images/new-code-legacy-on-day-one.png
---

You need to add a perfectly reasonable feature to an old marketplace: **customer credit limits**.

A customer can buy now and pay later, up to an approved amount. A new model, a little validation,
perhaps an admin screen. Nothing that sounds like an architecture discussion.

Then you reach the first foreign key.

**What does `customer` point to?**

The project already has a `CustomerProfile`. It holds contact details, billing fields, a few
flags, and some fields nobody is completely sure about anymore. Each profile belongs to one
`User`, and half the project depends on it:

```text
Order ───────────┐
Invoice ─────────┤
Refund ──────────┼──> CustomerProfile ──> User
Subscription ────┘
```

Using it would be the smallest change. But it would make the new feature follow a rule that no
longer fits the business.

## The Customer Isn't the Person Logging In

Imagine the marketplace started with individual buyers. One login, one profile, one customer.
At the time, treating them as the same thing worked well enough.

Now businesses buy through it. Alice and Bob both place orders for the same company. Each has a
login and a `CustomerProfile`, but the company has **one shared credit limit**.

Put the limit on Alice's profile and Bob appears to have a separate limit. Copy the amount to both
profiles and you still need to count both people's purchases against the same available credit.
The new feature now needs a way to find which profiles belong to the same customer.

The problem isn't that `CustomerProfile` is old. It's that it represents the wrong thing for this
decision.

> An old dependency becomes a problem when it makes new code follow rules that no longer fit.

The first workaround might fit in a helper function. The next feature will reuse that helper.
Six months later, replacing the profile model means changing six more parts of the code.

That's how new code becomes legacy on day one: it starts by working around a problem everyone
already knows about.

## Our Small Feature Just Became a Rewrite

So perhaps we should fix the customer model first.

Except `CustomerProfile` is used by orders, invoices, refunds, subscriptions, reporting, background
jobs, and probably one management command written in 2019 that runs every Sunday.

Some parts of the code need the person who placed an order. Others need the business that pays.
Pointing every relationship at a new table would not explain which one each part needs. We would
have to answer that question across the whole project before shipping credit limits.

Neither option feels right: repeat the old mistake, or turn a small feature into a rewrite.

There is a third option. Give the new feature a model that represents the right thing. Then add
one place where the old system connects to it.

## A New Model Needs a Better Meaning

Call the new model `Customer`. In this marketplace, it represents the business that buys products
and owns the credit account. That business still exists if an employee's login is removed.

What the model represents matters more than its name. A cleaner class with the same profile fields
would not solve our problem.

The relevant part of the Django model could look like this:

```python
from django.db import models


class Customer(models.Model):
    legal_name = models.CharField(max_length=255)


class CreditLimit(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
```

The example assumes one credit limit per customer in one currency. The important change is who
owns it: Alice and Bob's company, rather than either person's profile.

The existing profiles can point to that customer and still keep their links to `User`:

```text
Alice's CustomerProfile ──> Alice's User
          |
          +──────────────> Customer <── CreditLimit
          |                (company)
Bob's CustomerProfile ───> Bob's User
```

For this example, each profile belongs to one company. If users can buy for several companies,
we need to record those memberships and let users choose which company they are buying for.
A single foreign key would not be enough.

Before checking credit, the application finds the customer linked to the user's profile. It also
checks that the user has permission to buy for that customer. The credit rules then use the
customer's identity, not the profile's fields.

We also need to handle purchases made at the same time. Moving the foreign key alone won't stop
two purchases from spending the same remaining credit.

The application still depends on the old model. But only one part of the code needs to map the
old profile to the new customer. The rest of the credit feature doesn't need to know how that works.

## Did We Fix the Model, or Just Add Another One?

There are now two models where there used to be one. More joins, more things to understand, and
links between profiles and customers that can be wrong. Calling this design "clean" does not
make that extra work disappear.

The first difficult question is which existing profiles belong to the same business. Matching
names or email domains is not enough to give someone access to a company's credit account.
If we aren't sure where a profile belongs, we need to check. Treating every profile as a separate
customer would leave us with the same bug.

The second question is where each piece of information belongs. `Customer` identifies the business
that uses the credit. `CreditLimit` stores its approved amount. The old profile keeps its
login-related information.

We don't put a separately editable copy of the credit limit on each profile. That would give us
several amounts that could disagree, when there should be only one.

This is what makes the extra model useful. It makes each model's job clear, instead of just moving
fields between tables.

If the existing profile already represented the business correctly, we would need a good reason
to add `Customer`. Reusing an old model is fine when it represents the right thing.

## When Can We Remove the Old Code?

The connection between old and new code can stay around forever if we forget about it.
"We'll migrate the rest later" doesn't tell us when the work is done.

For this feature, the first goal is small: both employees use the same company credit account,
and credit rules no longer read `CustomerProfile` directly. We can write tests for that behavior
while the old system continues to run.

What we change next depends on what each relationship means, not what the table is called.
When the invoicing code needs to know which business to bill, it can use `Customer`. An order may
still need to record the person who placed it. Those are different relationships, and we may
need to keep both.

Imagine twenty million orders currently point to profiles. Changing all of those rows won't
necessarily improve the design.

But keeping the old links needs care too. Suppose an employee changes companies. Looking up their
current company won't tell us which company should pay for an old order. We need to preserve who
the order belonged to when it was placed, not just use whichever company the profile points to now.

So the goal isn't to make every arrow point to `Customer`. It's to stop using one relationship to
answer several different questions.

As we update the code, we can track which parts still treat a profile as a business. When nobody
uses an old lookup or workaround anymore, delete it. Keep relationships that still serve a real
purpose. Finishing the migration doesn't have to mean deleting everything old.

## A Better Place for the Next Feature

We started with credit limits. We did not finish with a redesigned marketplace.

Orders still work. The Sunday management command still runs. Some uncomfortable code remains.

But Alice and Bob now share the right credit account, and the next credit-related feature has a
place to go that does not depend on pretending a login is a business.

That is real progress, even if the architecture diagram looks more complicated for a while.
The benefit is not fewer boxes today. It is fewer new features built on the same mistake.

You don't need to untangle the whole codebase before making progress.

You just need to stop tying new knots.
