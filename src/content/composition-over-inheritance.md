---
title: "Composition Over Inheritance: Why Class Hierarchies Age Poorly"
description: >-
  A clean inheritance hierarchy works — until the business changes. See why child classes end up
  correcting their parents, and how composing small pieces keeps your code flexible.
tags: [design-patterns, clean-code, oop]
draft: false
author: mxpadidar
publishedAt: 2026-08-02
heroImage: ../assets/hero-images/composition-over-inheritance.png
---

We all want to write clean code and avoid repeating ourselves. When building an application,
inheritance is usually the first tool we reach for. It feels natural to put shared logic in a
parent class and let child classes inherit it.

But while inheritance can save time today, it often becomes a nightmare tomorrow.

Let's look at a real-world example of how a perfectly designed inheritance tree can break down as
business requirements change, and how **Composition** offers a much safer way to build software.

## The "Perfect" Base Class

Imagine we're building an order processing system for a company that sells physical products.

Every order follows the same workflow:

1. Generate an invoice.
2. Calculate shipping weight.
3. Deliver the order.

To avoid duplication, the team creates a base `OrderProcessor` class.

```python
from abc import ABC, abstractmethod

class OrderProcessor(ABC):

    def generate_invoice(self, items):
        ...

    def calculate_shipping_weight(self, items):
        ...

    @abstractmethod
    def deliver(self, items, destination):
        ...

    def process_order(self, items, destination):
        invoice = self.generate_invoice(items)
        weight = self.calculate_shipping_weight(items)

        print(f"Preparing to ship {weight}kg...")
        self.deliver(items, destination)

        return invoice
```

Creating a standard physical order is very simple. The child class only has to explain how to
deliver it.

```python
class PhysicalOrder(OrderProcessor):
    def deliver(self, items, destination):
        print(f"Loading boxes into truck for {destination}")
```

We can even add a new type of physical order, like a `FragileOrder`, without changing the base
class at all.

```python
class FragileOrder(OrderProcessor):
    def deliver(self, items, destination):
        print(f"Loading fragile boxes into truck for {destination}")
```

Everything works, and the design looks clean.

## The Breaking Point

A year later, the business starts selling E-books.

The team creates a `DigitalOrder` class because they want to reuse that excellent invoice
generation logic.

But digital products:

- Have no shipping weight.
- Are not shipped in boxes.
- Are delivered by email.

If we blindly reuse the parent's workflow, we get a weird result:

```text
Preparing to ship 0.0kg...
Emailing download links to user@example.com
```

The system technically works, but the core workflow no longer makes sense. To fix it and stop the
system from calculating weight, the child class has to start fighting the parent.

```python
class DigitalOrder(OrderProcessor):

    def deliver(self, items, destination):
        print(f"Emailing download links to {destination}")

    def calculate_shipping_weight(self, items):
        # Overriding the parent because digital items have no weight
        return 0.0

    def process_order(self, items, destination):
        # We have to rewrite the entire workflow to remove the weight logic
        invoice = self.generate_invoice(items)
        self.deliver(items, destination)
        return invoice
```

The developer only wanted to reuse **one method**: `generate_invoice()`.

To get it, they were forced to inherit a shipping weight calculation that made no sense, a
workflow built around physical products, and assumptions that no longer matched the business.

Eventually, they had to override the core workflow itself. **At that point, the child class is no
longer extending the parent. It is correcting it.**

## How Composition Solves the Problem

The problem isn't bad code. The problem is that the parent class forces child classes to accept
_everything_, even the parts they don't need.

**Composition** solves this by breaking the giant base class into small, independent pieces.
Instead of inheriting behavior, we assemble it.

Let's separate the invoice logic from the delivery logic:

```python
class InvoiceGenerator:
    def generate(self, items):
        ...

class PhysicalDelivery:
    def deliver(self, items, destination):
        weight = self.calculate_weight(items)
        print(f"Preparing to ship {weight}kg...")
        print(f"Loading boxes into truck for {destination}")

class DigitalDelivery:
    def deliver(self, items, destination):
        print(f"Emailing download links to {destination}")
```

Now, our `OrderProcessor` doesn't inherit anything. Instead, we pass the exact tools it needs to
do its job.

```python
class OrderProcessor:
    def __init__(self, invoice_generator, delivery_method):
        self.invoice_generator = invoice_generator
        self.delivery_method = delivery_method

    def process_order(self, items, destination):
        invoice = self.invoice_generator.generate(items)
        self.delivery_method.deliver(items, destination)
        return invoice
```

Look at how easy it is to handle changes now!

To make a physical order, we give it the physical delivery tool. To make a digital order, we give
it the digital delivery tool.

```python
# Creating a digital order
digital_order = OrderProcessor(
    invoice_generator=InvoiceGenerator(),
    delivery_method=DigitalDelivery()
)
```

There are no forced methods. There are no useless weight calculations. The digital order simply
ignores the physical concepts entirely. Each order type uses exactly what it needs, and nothing
more.

## Other Hidden Dangers of Inheritance

Forcing useless features onto child classes is just one reason why inheritance ages poorly. If
you rely too heavily on it, you will likely face two other major problems:

### 1. The Fragile Base Class (Tight Coupling)

Subclasses are tightly glued to their parent. If you find a bug in the base class and change how
a method works, you risk breaking every single child class connected to it. As your system grows,
touching the base class becomes incredibly dangerous.

### 2. The "God Class"

Over time, developers often get lazy. Instead of creating new classes, they just keep dumping
shared helper methods into the base class. The parent class slowly turns into a giant, messy
"God Class," and every subclass becomes heavy with dozens of methods they never actually use.

## Conclusion

Inheritance is not entirely evil, but it only works well when there is a strict, stable
relationship that will never change.

The reality is that business requirements always change. As your system evolves, inheritance
usually leads to tight coupling, fighting against base classes, and rigid workflows.

Composition favors small, focused components that can be easily plugged in, swapped out, and
tested. The next time you want to share code, try snapping small pieces together instead of
forcing them into a strict family tree.
