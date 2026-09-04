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
