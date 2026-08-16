---
title: Composition Over Inheritance, When Your Base Class Stops Making Sense
description: >-
  A clean inheritance hierarchy works until a subclass no longer fits its parent's assumptions.
  See how composition lets you reuse behavior without forcing unrelated concepts into the same hierarchy.
tags: [design-patterns, clean-code, oop]
draft: false
author: mxpadidar
publishedAt: 2026-08-18
heroImage: ../assets/hero-images/composition-over-inheritance.png
---

Inheritance usually looks best on the day you write it.

You find some shared behavior, move it into a base class, add a few subclasses, and everything
feels beautifully organized.

Then one requirement arrives that doesn't quite fit.

That's when subclasses stop extending their parent and start **correcting it**.

Let's follow one seemingly reasonable hierarchy until that happens — and see why composition
handles the change better.

## At First, Inheritance Looks Perfect

Imagine we're building an order processing system for a company that sells physical products.

Every order follows the same workflow:

1. Generate an invoice.
2. Calculate shipping weight.
3. Deliver the order.

So we create a base class:

```python
class OrderProcessor(ABC):
    def generate_invoice(self, items: list[str]) -> str:
        """Shared invoice generation logic."""

    def calculate_shipping_weight(self, items: list[str]) -> float:
        """Shared physical shipping logic."""

    def process_order(self, items: list[str], destination: str) -> str:
        invoice = self.generate_invoice(items)
        weight = self.calculate_shipping_weight(items)

        print(f"preparing to ship {weight}kg...")
        self.deliver(items, destination)

        return invoice

    @abstractmethod
    def deliver(self, items: list[str], destination: str) -> None:
        raise NotImplementedError
```

A physical order only needs to define how it's delivered:

```python
class PhysicalOrder(OrderProcessor):
    def deliver(self, items: list[str], destination: str) -> None:
        print(f"loading boxes into truck for {destination}")
```

We can add another type just as easily:

```python
class FragileOrder(OrderProcessor):
    def deliver(self, items: list[str], destination: str) -> None:
        print(f"loading fragile boxes into truck for {destination}")
```

Everything looks clean.

The subclasses reuse the common workflow, while each one specializes delivery.

But there is an assumption hidden inside the base class:

> **Every order has a shipping weight.**

For physical products, that assumption is perfectly reasonable.

Until the business changes.

## The Breaking Point

A year later, the company starts selling E-books.

The team creates a `DigitalOrder` because they want to reuse the invoice generation logic.

But digital products have no shipping weight. They aren't packed into boxes, and they aren't
delivered by truck.

If we reuse the parent's workflow unchanged, we get something like:

```text
Preparing to ship 0.0kg...
Emailing download links to user@example.com
```

That's already suspicious.

So the child starts fighting the parent:

```python
class DigitalOrder(OrderProcessor):
    def deliver(self, items: list[str], destination: str) -> None:
        print(f"emailing download links to {destination}")

    def calculate_shipping_weight(self, items: list[str]) -> float:
        return 0.0

    def process_order(self, items: list[str], destination: str) -> str:
        invoice = self.generate_invoice(items)
        self.deliver(items, destination)
        return invoice
```

The developer only wanted to reuse **one piece of behavior**: `generate_invoice()`.

Instead, they inherited shipping logic, a physical-product workflow, and assumptions that didn't
apply.

To make the subclass work, they had to:

- Return a fake shipping weight.
- Ignore part of the parent's workflow.
- Rewrite `process_order()` entirely.

**At that point, the child class is no longer extending the parent. It is correcting it.**

And once subclasses have to undo inherited behavior, the abstraction is working against the domain
instead of modeling it.

This is also closely related to the **Liskov Substitution Principle**.

`DigitalOrder` isn't really substitutable for the kind of `OrderProcessor` described by the base
class. The parent describes a workflow where shipping weight is meaningful, while the child has to
remove that behavior entirely.

The problem isn't the implementation of `DigitalOrder`.

The inheritance relationship itself is questionable.

## Composition Changes the Question

The problem isn't inheritance itself.

The problem is that our base class bundled several independent behaviors together and required
every subtype to accept the entire package.

Composition asks a different question.

Instead of:

> **What kind of order is this?**

we ask:

> **What capabilities does this order need?**

Invoice generation and delivery are independent responsibilities, so let's model them independently.

```python
class InvoiceGenerator:
    def generate(self, items: list[str]) -> str:
        """Shared invoice generation logic."""
        ...

class OrderDelivery(Protocol):
    """Interface for order delivery."""

    def deliver(self, items: list[str], destination: str) -> None:
        ...
```

Now `OrderProcessor` is composed from exactly the pieces it needs:

```python
class OrderProcessor:
    def __init__(self, invoice_generator: InvoiceGenerator, delivery: OrderDelivery) -> None:
        self.invoice_generator = invoice_generator
        self.delivery = delivery

    def process_order(self, items: list[str], destination: str) -> str:
        invoice = self.invoice_generator.generate(items)
        self.delivery.deliver(items, destination)
        return invoice
```

The processor no longer knows anything about shipping weight.

It only knows that an order needs an invoice and some form of delivery.

A physical delivery implementation can own the physical-shipping behavior:

```python
class PhysicalDelivery:
    def calculate_weight(self, items: list[str]) -> float:
        """Physical shipping calculation."""

    def deliver(self, items: list[str], destination: str) -> None:
        weight = self.calculate_weight(items)
        print(f"preparing to ship {weight}kg...")
        print(f"loading boxes into truck for {destination}")
```

Then we assemble a physical order:

```python
physical_order = OrderProcessor(
    invoice_generator=InvoiceGenerator(),
    delivery=PhysicalDelivery(),
)
```

Digital delivery is independent:

```python
class DigitalDelivery:
    def deliver(self, items: list[str], destination: str) -> None:
        print(f"emailing download links to {destination}")
```

And the digital order becomes:

```python
digital_order = OrderProcessor(
    invoice_generator=InvoiceGenerator(),
    delivery=DigitalDelivery(),
)
```

Both orders reuse invoice generation.

But neither one inherits behavior that doesn't belong to it.

> **Share the pieces that actually belong together instead of forcing objects into the same hierarchy.**

## Composition Handles Change Better

Now imagine the business adds more requirements:

- Express physical delivery.
- Insured physical delivery.
- Expiring download links.
- DRM-protected downloads.

With inheritance, it's easy to start encoding those features into subclasses:

```text
ExpressPhysicalOrder
InsuredPhysicalOrder
ExpressInsuredPhysicalOrder

ExpiringDigitalOrder
ProtectedDigitalOrder
ExpiringProtectedDigitalOrder
```

The problem isn't merely that we have more classes.

The deeper problem is that **independent features are becoming encoded into inheritance
relationships**.

Express delivery and insurance are separate decisions.

Expiration and DRM protection are separate decisions.

But an inheritance hierarchy encourages us to represent every combination as another subtype.

As those independent dimensions multiply, the hierarchy gets harder to reason about.

Composition lets those behaviors remain independent and be combined where needed.

For example, instead of putting every physical-delivery variation into a different `Order`
subclass, we can compose delivery behavior from smaller components.

The exact implementation depends on the system, but the design direction changes:

```text
OrderProcessor
    |
    +-- InvoiceGenerator
    |
    +-- PhysicalDelivery
            |
            +-- ExpressShipping
            +-- Insurance
```

Or for a digital order:

```text
OrderProcessor
    |
    +-- InvoiceGenerator
    |
    +-- DigitalDelivery
            |
            +-- ExpiringLinks
            +-- DRMProtection
```

The number of components can still grow.

Composition doesn't make complexity disappear.

What it does is keep independent behaviors independent, so adding a new combination doesn't
necessarily require adding another branch to a class hierarchy.

It also keeps responsibilities easier to reason about:

- `PhysicalDelivery` owns physical delivery.
- `DigitalDelivery` owns digital delivery.
- `InvoiceGenerator` owns invoice generation.
- Express shipping can own express-specific rules.
- Insurance can own insurance-specific rules.

Instead of tracing a chain of parent classes and overridden methods, you can look directly at the
component responsible for the behavior.

## So Is Inheritance Bad?

No.

Inheritance works well when the subtype genuinely preserves the meaning and expectations of its
parent.

If every method on the parent makes sense for every child, and subclasses specialize behavior
rather than remove or contradict it, inheritance may be exactly the right tool.

For example, if every delivery mechanism genuinely followed the same contract and only differed
in implementation, inheritance could still be a reasonable choice.

The warning signs appear when child classes start:

- Overriding methods just to disable them.
- Returning dummy values because a parent concept doesn't apply.
- Rewriting workflows already defined by the parent.
- Inheriting behavior they never use.
- Checking the subtype before deciding whether inherited behavior is valid.

For example:

```python
if isinstance(order, DigitalOrder):
    ...
```

A type check isn't automatically wrong, but repeated checks like this can indicate that the
abstraction is leaking.

When these patterns appear, ask whether you're modeling a real **is-a** relationship — or merely
trying to reuse a few behaviors.

Code reuse alone is usually not a strong enough reason to create an inheritance hierarchy.

## Conclusion

Inheritance organizes behavior around identity:

> **What is this object?**

Composition organizes behavior around capabilities:

> **What does this object need to do?**

Our `DigitalOrder` didn't need to become a special kind of physical-order processor just to reuse
invoice generation.

It needed two capabilities:

- Invoice generation.
- Digital delivery.

That's the signal to watch for.

When subclasses start disabling methods, returning fake values, or rewriting inherited workflows,
don't immediately add another override.

Ask a more fundamental question:

**Do these objects actually belong in the same hierarchy, or do they only share a few behaviors?**

If they only share behaviors, composition is often the cleaner abstraction.
