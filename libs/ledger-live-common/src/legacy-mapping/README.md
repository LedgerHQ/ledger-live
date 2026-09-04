# legacy-mapping

Projections from the legacy `Account` god object onto DDD entity shapes.

One place, on the **legacy** side of the boundary, on purpose. A `domain/entity/*` package that
imports `@ledgerhq/types-live` to write its own mapper inherits the object it exists to carve up —
and every entity that follows would inherit it too. So the entity declares its shape, and this folder
knows how to fill it from what we have today.

| Mapper | To |
| --- | --- |
| `toAccountBalances(account, at?)` | `AccountBalance[]` — `@domain/entity-account-balance` |

Each mapper disappears with the legacy account model, not before. Adding one is the right move when a
new entity slice needs to be populated from `Account` during the hybrid period; adding an entity
*without* a mapper here is the better move when it can be populated from a source directly.

## Why here, when live-common is maintenance-only

Because the thing being mapped lives here. `Account`, `TokenAccount` and the bridge that produces
them are live-common's; a mapper *from* them has no life of its own and no reason to outlive them. A
new `libs/legacy-mapping` package would be a new, permanent-looking home for code whose whole purpose
is to be deleted — and it would still depend on live-common for the type it maps, so it would buy
no decoupling.

The rule this respects is the one that matters: **nothing new depends on `Account`.** Consumers
depend on `@domain/entity-*`. This folder is the one-way door between the two, on the side that is
already condemned.
