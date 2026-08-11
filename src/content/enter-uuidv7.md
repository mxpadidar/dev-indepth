---
title: "Why UUIDv7 Is a Better Primary Key for PostgreSQL"
description:
  "Learn how UUIDv4 affects PostgreSQL B-tree indexes, when UUIDv7 is a better alternative, and when
  BIGINT still wins."
tags: ["python", "postgresql", "database", "system-design"]
draft: false
author: mxpadidar
publishedAt: 2026-07-19
heroImage: "../assets/hero-images/enter-uuidv7.png"
---

Your API is still fast and your queries have not changed, but inserts into your largest PostgreSQL
table keep getting slower. The culprit might be hiding in your primary key:

```python
id = uuid.uuid4()
```

UUIDv4 looks harmless. At a few thousand rows, it usually is. At a few hundred million rows, its
randomness starts working against PostgreSQL's B-tree index.

Python 3.14 gives us another option in the standard library: `uuid.uuid7()`. It keeps the
distributed-generation benefits of a UUID while producing values that are roughly ordered by
creation time. Not the best key for every table—but a much better default when you need to generate
IDs outside the database.

## The Primary-Key Trade-off

Auto-incrementing integers are compact, fast, and naturally ordered. Their main limitation is
coordination: if several services create records independently, they must ask a shared database for
the next value.

UUIDs avoid that coordination. An application can generate an ID before connecting to the database,
include it in an event, and safely merge records created by different services. That is useful for
distributed systems, offline writes, event-driven architectures, and public identifiers that should
not expose a simple sequence.

The problem is not UUIDs themselves—it is using a uniformly random UUID as an indexed key.

## Why UUIDv4 Makes a B-tree Work Harder

A PostgreSQL primary key is backed by a B-tree index, which keeps keys sorted so rows can be found
without scanning the whole table. Sequential keys send new entries to the rightmost pages, which
stay hot in memory. UUIDv4 values land throughout the key space:

```text
f73a3f5f-2d46-4c55-9a2e-73845d82c269
1a9c8d2e-714f-46b3-b681-2df45fd2ca11
8d42b1c7-28ce-482a-a7ce-a0b421cc8618
```

Each insert may touch a different index page. As the index grows beyond memory, that random access
pattern causes cache misses, extra page reads and writes, page splits, and lower insert throughput.
Think of the index as a sorted binder: sequential IDs add entries near the back, UUIDv4 repeatedly
sends you to unrelated sections.

Note this describes the **index**, not the heap placement of rows. And on small applications you may
never notice the difference—it matters on large, write-heavy tables whose indexes no longer fit
comfortably in memory.

## What UUIDv7 Changes

UUIDv7 begins with a 48-bit Unix timestamp in milliseconds; the remaining bits provide uniqueness
through randomness and, in some implementations, monotonic counters:

```text
01945f2a-7c00-7a5e-9b14-2f7c0db54a12
01945f2a-7c01-71d2-a843-0af91c8e62b7
01945f2a-7c02-7f64-8c25-61e0a73d94bc
└───────────┘
 timestamp prefix
```

They still look opaque, but the leading timestamp makes newer values sort after older ones, so most
writes cluster near the right edge of the index instead of spreading across the tree. UUIDv7 does
not make a UUID as compact as an integer, and it cannot remove every page split—it simply gives
PostgreSQL a much more cache-friendly insertion pattern than UUIDv4.

## Python 3.14 Makes It Easy

Python 3.14 added UUID versions 6, 7, and 8 to the standard library, so creating one is a single
call:

```python
import uuid

uid = uuid.uuid7()
```

It plugs straight into a normal `uuid PRIMARY KEY` column—PostgreSQL sees a regular UUID, and the
advantage comes from the value's ordering, not from a new database type.

## The Trade-offs UUIDv7 Does Not Remove

UUIDv7 is an improvement, not a free upgrade:

- **UUIDs are still larger**—16 bytes versus `BIGINT`'s 8, repeated in every index and foreign key.
- **Creation time is visible**—the embedded timestamp lets anyone estimate when an ID was created.
- **Time order is not a global sequence**—clocks move and machines can generate values in the same
  millisecond, so keep your `created_at` column.
- **A primary key is not an access token**—obscurity is not authorization; use a dedicated secure
  token where possession grants access.
- **Migration can cost more than it saves**—a stable UUIDv4 table does not need an emergency
  migration just because UUIDv7 exists.

## Which Key Should You Choose?

- **One PostgreSQL database owns ID generation** → `BIGINT GENERATED ... AS IDENTITY`
- **Services must generate IDs independently** → UUIDv7
- **Records are created offline or in multiple regions** → UUIDv7
- **You specifically need uniformly random UUIDs** → UUIDv4
- **An existing UUIDv4 table performs well** → Keep UUIDv4
- **Possessing the identifier grants access** → Use a separate secure token

For new systems, my rule is simple:

> Use `BIGINT` when PostgreSQL can own ID generation. Use UUIDv7 when IDs must be generated outside
> the database. Use UUIDv4 only when you specifically need uniformly random UUIDs.

## The Takeaway

UUIDv7 narrows the gap between index-friendly integers and decentralized UUIDs: distributed
applications get an identifier they can create anywhere, while PostgreSQL gets a key with a
friendlier insertion pattern. With Python 3.14, the code change can be as small as:

```python
uuid.uuid4()  # → uuid.uuid7()
```

The decision behind that one-character change still deserves thought—and real results depend on
table size, memory, and write concurrency, so measure rather than assume. For a new, write-heavy
table that needs application-generated IDs, UUIDv7 is usually the more practical default.
