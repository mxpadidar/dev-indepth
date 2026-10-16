---
title: A Practical Guide to Python asyncio
description: >-
  Build up a dashboard-loading example to learn asyncio tasks, gather(), TaskGroup,
  cancellation, timeouts, and working with blocking libraries.
tags: [python, concurrency]
draft: false
author: mxpadidar
publishedAt: 2026-10-16
heroImage: ../assets/hero-images/python-asyncio-guide.png
---

A dashboard needs a profile, recent orders, and notifications. Loading them together is the easy
part. You also need to decide what happens when one fails, takes too long, or is no longer needed.

Those decisions determine which asyncio API to use. We'll work through them with small examples
from the same dashboard, starting with one async call and ending with a blocking client.

Examples require Python 3.11 or newer. Each Python block is a standalone script. Sleeps simulate
I/O, so you can run everything without a database or external service.

## Run One Operation: async def, await, and asyncio.run()

Start by loading the profile:

```python
import asyncio


async def load_profile() -> dict[str, str]:
    print("Loading profile")
    await asyncio.sleep(0.1)
    return {"name": "Ada"}


async def main() -> None:
    coroutine = load_profile()
    print("Coroutine created")
    profile = await coroutine
    print(profile)


asyncio.run(main())
```

Output:

```text
Coroutine created
Loading profile
{'name': 'Ada'}
```

`async def` defines a coroutine function. Calling `load_profile()` creates a coroutine object;
its body has not run yet. That's why `Coroutine created` appears first.

`await coroutine` enters that coroutine and waits for its result. When `load_profile()` returns,
`profile` receives the dictionary. The coroutine object represents the execution; the dictionary
is its result.

[`asyncio.run()`][runner] manages the event loop, runs `main()`, and closes the loop afterward.
Use it at the entry point of a standalone script. Inside an async framework or notebook that
already runs an event loop in the same thread, await your coroutine there instead.

The event loop runs ready tasks and monitors timers and I/O. In one event-loop thread, only one
task executes Python code at a time. When the profile load suspends at its sleep, the loop can
run other scheduled work.

Directly awaiting the profile and then the orders would still load them sequentially. To overlap
independent operations, we need to schedule them separately. The earlier post on
[await and concurrency][scheduling-post] explains that scheduling behavior in more detail.

## Start Independent Loads: asyncio.create_task()

A task schedules and manages a coroutine's execution. It gives us an object we can await later,
inspect, or cancel.

Here, orders finishes first even though we await profile first:

```python
import asyncio


async def load_section(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    print(f"{name}: loaded")
    return f"{name} data"


async def main() -> None:
    profile_task = asyncio.create_task(load_section("profile", 0.2))
    orders_task = asyncio.create_task(load_section("orders", 0.1))

    profile = await profile_task
    orders = await orders_task
    print("Results:", profile, orders)


asyncio.run(main())
```

Typical output:

```text
orders: loaded
profile: loaded
Results: profile data orders data
```

Both tasks are scheduled before either is awaited. While `main()` waits for profile, the orders
task can finish. Awaiting `orders_task` then retrieves its already available result.

Creating each task immediately before awaiting it would preserve the sequential behavior.
Scheduling both first is what allows these loads to overlap.

Keep references to tasks you create and arrange to await them. `await task` waits if necessary
and returns the result, or raises the task's exception. `task.result()` reads an outcome that
must already be available; it raises `InvalidStateError` if the task is still pending.
The [Task API][task] covers these operations.

## Collect the Results: asyncio.gather()

If we want to start several loads and collect their results together, `gather()` handles the
task creation for us:

```python
import asyncio


async def load_section(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    print(f"{name}: loaded")
    return f"{name} data"


async def main() -> None:
    profile, orders, notifications = await asyncio.gather(
        load_section("profile", 0.3),
        load_section("orders", 0.1),
        load_section("notifications", 0.2),
    )
    print("Results:", profile, orders, notifications)


asyncio.run(main())
```

Typical output:

```text
orders: loaded
notifications: loaded
profile: loaded
Results: profile data orders data notifications data
```

[`gather()`][gather] schedules coroutine arguments as tasks. On success, it returns results in
argument order, regardless of completion order. We can unpack them without tracking which
load finished first.

Failure behavior matters when choosing it. By default, a task failure makes `await gather(...)`
raise, but does not automatically cancel the other submitted tasks. With
`return_exceptions=True`, it waits for all outcomes and puts exceptions alongside successful
results in the returned list. That can suit a dashboard where unavailable sections are handled
individually.

If an exception instead escapes `main()`, `asyncio.run()` shuts down and cancels pending tasks.
That shutdown can make it look as though `gather()` cancelled its siblings. The cancellation
comes from ending the program.

## Stop Related Work When One Task Fails: asyncio.TaskGroup

Suppose this dashboard requires both profile and orders. If profile cannot load, continuing the
orders request is no longer useful. A `TaskGroup` gives those loads a shared lifetime.

```python
import asyncio


async def load_profile() -> str:
    await asyncio.sleep(0.1)
    raise ConnectionError("Profile service unavailable")


async def load_orders() -> str:
    print("Orders: started")
    try:
        await asyncio.sleep(1)
        print("Orders: loaded")
        return "orders data"
    finally:
        print("Orders: cleanup")


async def main() -> None:
    try:
        async with asyncio.TaskGroup() as group:
            profile_task = group.create_task(load_profile())
            orders_task = group.create_task(load_orders())
    except* ConnectionError as errors:
        for error in errors.exceptions:
            print(f"Dashboard failed: {error}")
    else:
        print(profile_task.result(), orders_task.result())


asyncio.run(main())
```

Output:

```text
Orders: started
Orders: cleanup
Dashboard failed: Profile service unavailable
```

When profile fails, the group cancels the unfinished orders task and waits for its cleanup.
`Orders: loaded` never prints. Only after the tasks have finished does control reach the handler.

[`TaskGroup`][task-group] collects ordinary task failures into an `ExceptionGroup`.
`except* ConnectionError` handles matching errors within that group; unmatched errors still
propagate. The group's cancellation of orders does not become another ordinary failure.

`async with` allows the context manager to await work when entering or exiting. Here, leaving
the block waits for the group's tasks. If both loads succeed, the `else` branch reads their
results. The group does not build an ordered result list for us.

Use a task group when related work should finish within the same scope and an ordinary failure
should stop the remaining tasks.

## Cancel Work and Run Its Cleanup

We can also stop a load explicitly. For example, the caller may decide it no longer needs the
notifications result.

```python
import asyncio


async def load_notifications() -> str:
    print("Notifications: started")
    try:
        await asyncio.sleep(60)
        return "notifications data"
    finally:
        print("Notifications: cleanup")


async def main() -> None:
    task = asyncio.create_task(load_notifications())
    await asyncio.sleep(0)  # Let the task start and enter its try block.
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print("Notifications: cancelled")


asyncio.run(main())
```

Output:

```text
Notifications: started
Notifications: cleanup
Notifications: cancelled
```

[`task.cancel()`][cancellation] requests cancellation. It does not instantly terminate the
coroutine. In this example, cancellation interrupts the pending sleep with `CancelledError`,
and the `finally` block runs as the coroutine exits.

Awaiting the cancelled task lets `main()` wait for that exit and handle the expected cancellation.
The cleanup print represents where resource cleanup would happen in a real implementation.

Use `try/finally` for cleanup. If the worker catches `CancelledError`, normally re-raise it after
cleanup so the caller can observe cancellation. Stopping a task does not undo external changes
it already made.

## Put a Deadline on an Operation: asyncio.timeout()

A slow orders service should not leave the caller waiting indefinitely. Apply a deadline around
the work and handle the timeout outside the block:

```python
import asyncio


async def load_orders() -> str:
    try:
        await asyncio.sleep(1)
        return "orders data"
    finally:
        print("Orders: cleanup")


async def main() -> None:
    try:
        async with asyncio.timeout(0.1):
            orders = await load_orders()
            print(orders)
    except TimeoutError:
        print("Orders: timed out")


asyncio.run(main())
```

Output:

```text
Orders: cleanup
Orders: timed out
```

[`asyncio.timeout()`][timeout] cancels the current task when its deadline expires and converts
that cancellation into `TimeoutError` as the context exits. Here, the current task is inside
`load_orders()`, so the load's cleanup runs before the outer handler.

A timeout can cover several awaits inside the same block, giving the whole operation one
time budget. Cleanup may take additional time, and blocking code can delay the loop from
processing the deadline. The timeout does not forcibly interrupt synchronous Python code.

## Call a Blocking Library Without Blocking the Loop: asyncio.to_thread()

Suppose the profile client is synchronous. Calling it directly inside an async function would
hold the event-loop thread until it returns.

`to_thread()` lets that call run in a worker thread. The notifications task can keep progressing:

```python
import asyncio
import time


def load_legacy_profile() -> str:
    print("Legacy profile: started")
    time.sleep(0.3)  # Simulate a blocking client call.
    print("Legacy profile: loaded")
    return "profile data"


async def load_notifications() -> str:
    await asyncio.sleep(0.1)
    print("Notifications: loaded")
    return "notifications data"


async def main() -> None:
    profile, notifications = await asyncio.gather(
        asyncio.to_thread(load_legacy_profile),
        load_notifications(),
    )
    print("Results:", profile, notifications)


asyncio.run(main())
```

Typical output:

```text
Legacy profile: started
Notifications: loaded
Legacy profile: loaded
Results: profile data notifications data
```

Notifications can finish while the blocking profile call is still running. The thread handles
that call while the event loop continues running async tasks. Exact output order depends on
scheduling; the loop is free to make progress throughout the blocking wait.

[`to_thread()`][threads] returns a coroutine, so it must be awaited or scheduled, as `gather()`
does here. Cancelling the task awaiting it does not forcibly stop a function already running
in the worker thread. A blocking network client still needs its own timeout settings.

Use an async I/O API when one is available, or `to_thread()` to integrate blocking I/O. For
long-running pure-Python CPU work that needs parallel execution on a usual GIL-enabled build,
use a process pool. More asyncio tasks do not parallelize that computation.

## Where Futures Fit

You can use the APIs above without creating a Future yourself. The term still appears in
documentation and library interfaces, so it helps to know its role.

A [Future][future] represents an outcome that other code will supply later. That code can set
its result or exception. Awaiting a pending Future suspends the current task until an outcome
becomes available.

A plain Future does not run a coroutine. A Task is a specialized Future that manages coroutine
execution. Libraries often use Futures to connect callbacks with code that uses `await`.

Coroutine objects, Tasks, and Futures are all **awaitables**: objects accepted by `await`.
Awaiting one does not necessarily suspend execution. For example, awaiting a task that has
already finished can retrieve its result immediately.

## Choosing an API

| What you need                             | Use                 | Behavior to remember                                     |
| ----------------------------------------- | ------------------- | -------------------------------------------------------- |
| Finish an operation before continuing     | `await operation()` | Direct awaits remain sequential.                         |
| Schedule work and keep its handle         | `create_task()`     | Keep the task and manage its completion.                 |
| Collect concurrent results in input order | `gather()`          | A failure does not cancel siblings.                      |
| Manage related work in one scope          | `TaskGroup`         | An ordinary failure cancels remaining tasks.             |
| Stop work that is no longer needed        | `task.cancel()`     | Request cancellation, then await cleanup.                |
| Limit time spent on an operation          | `timeout()`         | Handle `TimeoutError` outside the block.                 |
| Run blocking I/O                          | `to_thread()`       | Cancelling the await does not stop the running function. |

[runner]: https://docs.python.org/3.14/library/asyncio-runner.html#asyncio.run
[task]: https://docs.python.org/3.14/library/asyncio-task.html#asyncio.Task
[gather]: https://docs.python.org/3.14/library/asyncio-task.html#asyncio.gather
[task-group]: https://docs.python.org/3.14/library/asyncio-task.html#task-groups
[cancellation]: https://docs.python.org/3.14/library/asyncio-task.html#task-cancellation
[timeout]: https://docs.python.org/3.14/library/asyncio-task.html#asyncio.timeout
[threads]: https://docs.python.org/3.14/library/asyncio-task.html#asyncio.to_thread
[future]: https://docs.python.org/3.14/library/asyncio-future.html#asyncio.Future
