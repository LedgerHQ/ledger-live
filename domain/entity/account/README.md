# @domain/entity-account

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The account **identity**: the branded id every `@domain/entity-account-*` package is keyed by.

## Responsibility

- `AccountId` — a top-level account's id. Must not contain `+`.
- `TokenAccountId` — `<parentAccountId>+<encodedTokenId>`, exactly one `+`.
- `AnyAccountId` — the union, for the many places that hold either.
- `parseAnyAccountId` / `safeParseAnyAccountId` — parse a raw string, throwing or missing.
- `encodeTokenAccountId` / `getParentId` — move between an account and its token accounts.

The two ids are distinct types, so a function that only accepts a main account says so in its
signature rather than checking for a `+` at runtime.

This package owns the identity and nothing else. What an account *has* — a name, a balance, a
history, a star — lives in its own `@domain/entity-account-*` package, each keyed by these ids.
The relationship mirrors `@domain/entity-currency` and its `@domain/entity-currency-*` packages.

## Usage

```ts
import { AccountIdSchema, parseAnyAccountId, type AnyAccountId } from "@domain/entity-account";

const id = AccountIdSchema.parse("js:2:ethereum:0xabc:"); // AccountId
const either = parseAnyAccountId(raw); // AccountId | TokenAccountId
```
