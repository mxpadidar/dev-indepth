---
title: "FastAPI vs Django: The Wrong Tool for the Job"
description: >-
  Why FastAPI wins for API-only projects: native async, type-safe validation, and zero boilerplate.
tags: [fastapi, django, python, rest-api]
draft: false
author: mxpadidar
publishedAt: 2026-07-12
heroImage: ../assets/hero-images/fastapi-vs-django.png
---

The first API I ever shipped was Django + DRF. It took a week to scaffold, half of it spent reading
serializers documentation I didn't want to write, and the endpoint itself was 20 lines. A friend
asked why it took so long for one endpoint and I didn't have a good answer. That's the whole post,
really — the rest is just me explaining why.

## Django ships you a house. You wanted a room.

Django was built for a world where your app rendered HTML and managed a session and a cart and an
admin back office. If you're building a JSON API, here's what you're carrying anyway:

- A template engine you'll never call
- Form handling for forms you don't have
- Session middleware for logins that live in your auth service, not your API
- An admin panel — the good part — that someone on the team will absolutely ship to production "just
  in case"

None of that is free. Every one of those batteries adds import time, startup time, and a footgun
waiting for a misconfigured setting to fire.

With FastAPI, the equivalent of "hello world" is:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello World"}
```

That's it. It runs. I can deploy it. There isn't a settings file to trip over.

## The async gap is real, and it's the one that bites

FastAPI is built on ASGI from day one. `async def` endpoints are not a special case — they're the
default way you write code.

```python
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await db.fetch_one("SELECT * FROM users WHERE id = :id", {"id": user_id})
    return user
```

Django got there eventually — async views landed, then async ORM bits — but it's a retrofit. The ORM
still blocks on sync paths, middleware is mostly sync, and the moment your "async Django app"
touches the ORM the way you'd expect, you're back to a thread pool pretending. I've debugged exactly
this: a Django view marked `async` that blocked a worker for every query, because the query itself
was sync.

If your workload is I/O-bound — and nearly all APIs are — that gap shows up in concurrency, not in a
single-request benchmark.

## Performance: the boring truth

FastAPI is faster on the classic JSON-endpoint benchmarks, usually somewhere in the 1.5–3x range
against Django + DRF, and I've reproduced that on my own machine. Here's the part the benchmarks
don't tell you: it usually doesn't matter. If your endpoint does one database query, the database is
your bottleneck, not the framework.

What _does_ matter is that FastAPI doesn't make the easy things expensive. Less overhead per request
means more headroom before you need a bigger instance, and a smaller memory footprint at rest. It's
a nice margin to have, not a religion. Pick FastAPI for the developer experience; treat the
benchmark numbers as a bonus.

## Type hints that do the work for you

This is the feature I refuse to give back. Declare a model, and FastAPI validates requests,
serializes responses, and generates the docs from the same definition:

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
    age: int | None = None

@app.post("/users/")
async def create_user(user: User):
    # invalid body? FastAPI returns 422 before your code runs
    return {"user_id": user.id, "name": user.name}
```

In Django you get to write this by hand. The serializers, the validation rules, the error handling —
and if you want the docs to be accurate, a third-party package on top:

```python
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

class UserSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    age = serializers.IntegerField(required=False)

@api_view(["POST"])
def create_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data, status=201)
    return Response(serializer.errors, status=400)
```

Same job, twice the code, and the docs are now a third project you have to keep in sync. FastAPI's
`/docs` page isn't a nice extra — it's a side effect of the code you already wrote, so it can't
drift out of date. That's worth a lot in a codebase that's three years old.

## The dependency injection you actually use

FastAPI's DI looks like ceremony until you need to test something with a database behind it:

```python
from fastapi import Depends

def get_db():
    db = Database()
    try:
        yield db
    finally:
        db.close()

def override_get_db():
    return MockDatabase()

app.dependency_overrides[get_db] = override_get_db
```

One line swaps the real database for a mock, no mock framework, no patching, no test settings
module. In Django I always ended up with a combination of `unittest.mock`, `override_settings`, and
a custom test database setup, and it worked — it just took an hour every time I had to remember how.

## When I'd still pick Django

Being honest here makes the rest of the post worth reading: Django is still the right call in some
places.

- Your product is a content site with an admin back office, and the admin panel is a feature, not a
  liability.
- You're building internal tools where CRUD screens matter more than latency.
- Your team already lives in Django. Migrating a team's muscle memory is more expensive than the
  performance difference.

I reach for Django about as often as I reach for a sledgehammer: when the job is actually a wall.

## Verdict

If you're building an API — not a website, an API — FastAPI is the tool that fits the job. Native
async, type-safe validation, docs that can't go stale, and none of the full-stack machinery you'd
have to drag along and maintain.

The week I spent scaffolding that first Django API? The same endpoint in FastAPI took me an
afternoon, and it was still the simplest code in the repo two years later. That's the whole
argument.
