---
title: Dependency Injection (DI) Is a .env File for Your Classes
description: >-
  You wouldn't hardcode your database URL, so why hardcode your dependencies? Learn
  dependency injection in Python through the same simple idea behind .env files.
tags: [design-patterns, clean-code, oop]
draft: false
author: mxpadidar
publishedAt: 2026-08-23
heroImage: ../assets/hero-images/di-interface.png
---

Dependency Injection sounds like something you need a framework, an architecture book,
and three years of enterprise Java to understand.

_You don’t._

If you’ve ever moved a value from your code into a `.env` file, you already understand the idea.

You just haven’t applied it to objects yet.

## The Golden Rule of `.env` Files

You already know not to hardcode configuration:

```python
def connect_to_db():
    db_url = os.getenv("DATABASE_URL")
```

Instead of deciding what database to use inside the function, you let the environment provide it.
Production can point to one database, while your laptop points to `localhost`.

The important idea isn't the `.env` file itself. It's this:

**Don't hardcode what you can provide from the outside.**

> With `.env` files, we apply that rule to **data**.
> Dependency Injection applies the same rule to **objects**.

## We Don’t Hardcode Data, So Why Hardcode Dependencies?

With `.env` files, we learned not to hardcode values. But when we work with objects and services,
we often do exactly that.

Suppose we're building an order service that sends a notification after an order is placed:

```python
class EmailNotifier:
    def send(self, message: str) -> None:
        print(f"Sending email: {message}")


class OrderService:
    def place_order(self) -> None:
        # ... place the order

        notifier = EmailNotifier()  # Hardcoded dependency
        notifier.send("Your order has been placed!")
```

The problem is this line:

```python
notifier = EmailNotifier()
```

`OrderService` has hardcoded **how notifications must be delivered**.
It can't use anything other than email.

That's the object equivalent of hardcoding your database URL.

Want to send an SMS instead? Change the class.
Want to use push notifications? Change the class.
Want to use a fake notifier in tests? Change the class.

The dependency isn't configurable from the outside. It's trapped inside `OrderService`.

And **that** is the problem Dependency Injection solves.

## So, What Exactly Is a Dependency?

A **dependency** is something a piece of code needs in order to do its job.

In our example, `OrderService` needs something that can send notifications.

Right now, that something is `EmailNotifier`:

```python
notifier = EmailNotifier()
```

That means `EmailNotifier` is a **dependency** of `OrderService`.

Dependencies can be things like databases, API clients, email services, loggers, payment gateways,
or other classes.

The important question is: **who decides which dependency gets used?**

Right now, `OrderService` decides for itself.

## The Fix: Stop Building Dependencies Inside Your Class

Dependency Injection follows the same idea we used with `.env` files:

**Don't hardcode what can be provided from the outside.**

Before, `OrderService` created its own notifier. With Dependency Injection, we flip that around.

`OrderService` doesn't create the notifier anymore—it **asks for one**:

```python
class EmailNotifier:
    def send(self, message: str) -> None:
        print(f"Sending email: {message}")


class OrderService:
    def __init__(self, notifier) -> None:
        self.notifier = notifier

    def place_order(self) -> None:
        # ... place the order

        self.notifier.send("Your order has been placed!")
```

That's Dependency Injection.

The dependency is created somewhere else and **injected** into the class:

```python
notifier = EmailNotifier()
order_service = OrderService(notifier)
```

`OrderService` no longer decides _how_ notifications are delivered.

It only knows that it has something capable of sending them.

A nice way to think about it is:

> `OrderService` decides **when** a notification should be sent.
> It shouldn't decide **how** that notification is delivered.

## Interfaces Make DI Even Better

Dependency Injection works without an interface, but an interface makes the dependency clearer.

In Python, we can use a `Protocol` to describe what `OrderService` expects:

```python
from typing import Protocol


class Notifier(Protocol):
    def send(self, message: str) -> None:
        ...
```

Now `OrderService` depends on the **contract**, not on `EmailNotifier` specifically:

```python
class OrderService:
    def __init__(self, notifier: Notifier) -> None:
        self.notifier = notifier
```

Anything that provides `send()` can be injected—email, SMS, push notifications, or a fake
implementation for tests.

The interface doesn't create Dependency Injection. **It just makes the dependency explicit and easier to swap.**

## Now We Can Swap the Dependency

In the actual application, we can inject whichever notifier we want:

```python
class EmailNotifier:
    def send(self, message: str) -> None:
        print(f"Sending email: {message}")


class SMSNotifier:
    def send(self, message: str) -> None:
        print(f"Sending SMS: {message}")


class PushNotifier:
    def send(self, message: str) -> None:
        print(f"Sending push notification: {message}")
```

Want email?

```python
order_service = OrderService(EmailNotifier())
order_service.place_order()
```

Want SMS instead?

```python
order_service = OrderService(SMSNotifier())
order_service.place_order()
```

The `OrderService` doesn't change at all.

And in our tests, we can inject a fake notifier:

```python
class FakeNotifier:
    def send(self, message: str) -> None:
        print("Fake notification sent")


order_service = OrderService(FakeNotifier())
order_service.place_order()
```

Our test doesn't send a real email, SMS, or push notification.

Same `OrderService`. Different dependency. **The class itself never changes.**

And this gives us more than easier testing:

1. **Fast, isolated tests:** Replace databases, APIs, notification services, or anything else that
   would make your tests slow or unreliable.
2. **Easier changes:** Switching from email to SMS or push notifications doesn't require rewriting
   `OrderService`. Implement the same contract and inject the new dependency.
3. **Better tooling:** With a `Protocol`, your IDE and type checker know exactly what kind of
   object `OrderService` expects.

That's the core idea behind Dependency Injection:

> **Your class says what it needs. Someone else decides what it gets.**

So the next time you write something like:

```python
service = SomeService()
```

inside a class or function, ask yourself:

**Should this class really be choosing its own dependency?**

If the answer is no, pass it in instead.
