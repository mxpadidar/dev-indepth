---
title: "Why Big O Actually Matters: Time Complexity in Python"
description: >-
  An algorithm isn't slow because of your hardware — it's slow because of how it grows. Big O
  notations explained with Python examples you'll actually write.
tags: [algorithms, data-structures, python]
draft: false
author: mxpadidar
publishedAt: 2026-06-21
heroImage: ../assets/hero-images/time-complexity.png
---

Your API responds in 2 seconds with a thousand users, and in 30 seconds with ten thousand.

That's not a hardware problem. It's a time-complexity problem.

**Time complexity** describes how an algorithm's running time grows relative to the input size
(`n`). Rather than measuring exact execution time, it focuses on growth patterns as inputs
become larger.

In practice, we usually care about the **worst-case scenario** — the slowest the algorithm can
be for a given input size. It tells us the maximum running time to expect, and whether the
algorithm stays practical under difficult inputs.

To express that growth, we use **Big O notation**.

Big O keeps only the fastest-growing part of an algorithm's cost and ignores fixed overhead and
slower-growing work. That makes it possible to compare algorithms independently of hardware or
implementation details.

## O(1) — Constant Time

The operation always takes the same amount of time, regardless of the list size.

- Execution time does not change with input size.
- Example: accessing an element in a list by index.

```python
def get_first_item(arr: list[str]) -> str:
    return arr[0]
```

## O(log n) — Logarithmic Time

Each iteration halves the search space, leading to logarithmic growth.

- Time grows very slowly as input increases.
- Common in divide-and-conquer algorithms.

```python
def binary_search(arr: list[str], target: str) -> int:
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

## O(n) — Linear Time

If the list has `n` elements, the loop runs `n` times.

- Time grows proportionally with input size.
- Common when iterating through a collection once.

```python
def print_all(arr: list[str]) -> None:
    for item in arr:
        print(item)
```

## O(n log n) — Linearithmic Time

Algorithms that **split the problem into smaller parts** and then **do linear work at each
level** land here.

Each split reduces the problem size by half (`log n` levels), and at every level the algorithm
processes all `n` elements.

- Slightly faster growth than quadratic time.
- Common in efficient sorting and divide-and-conquer algorithms.

```python
def process(arr: list[str]) -> list[str]:
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    process(arr[:mid])
    process(arr[mid:])

    for _ in arr:
        ...  # doing some linear work
    return arr
```

## O(n²) — Quadratic Time

For `n` elements, the number of operations grows proportionally to `n²`.

- Time increases with the square of the input size.
- Commonly caused by nested loops iterating over the same data.

```python
def print_pairs(arr: list[str]) -> None:
    for i in arr:
        for j in arr:
            print(i, j)
```

## O(2^n) — Exponential Time

Each call branches into two more calls, causing exponential growth.

- Execution time roughly doubles with each additional input element.
- Becomes impractical very quickly as `n` increases.
- Common in naive recursive solutions.

```python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

## The Growth Order

From best to worst, the common classes are:

```text
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n) < O(n!)
```

The gap between them is not academic. With `n = 1000`, an `O(n)` loop runs a thousand steps while
an `O(n²)` loop runs a million — and an `O(2^n)` algorithm is effectively over.

Big O ignores the constants because constants don't decide the future. They decide whether the
first thousand users have a nice day. The growth class decides whether your service survives
the ten-thousandth.
