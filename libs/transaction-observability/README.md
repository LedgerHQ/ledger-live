# `@ledgerhq/transaction-observability`

Normalized sign/broadcast transaction log events, a global observer registry, and the
classification that turns raw errors and family-specific transaction wording into a stable
analytics vocabulary.

Consumed by `@ledgerhq/live-common`'s account-bridge seam, and by the desktop and mobile apps
which each register an observer at startup.

## What this is for

One event shape per outcome, per stage, across every earn flow — so that failures are countable
two ways: **how many** at each stage, and **of what kind**. Both halves have to hold for the
numbers to mean anything, which is why so much of this package is classification rather than
plumbing:

- an outcome that cannot be attributed to a stage inflates or deflates a step of the funnel
- an outcome whose cause collapses into `unknown` is counted but not actionable

So `unknown` rates are themselves tracked signals, not tolerated noise: `error_category:
unknown` says the error taxonomy has fallen behind, and `raw_transaction_type` present with no
`transaction_type` says the staking-action mapping has. Both are visible in the data rather than
silent.

## Why this lives in `libs/`

The DDD guide treats `libs/*` as legacy and directs new packages to `shared/`, `domain/` or
`features/`. This one cannot go there: its whole job is to read `Account`, `Operation`,
`SignedOperation`, `TransactionSource` and `OperationType`, and those types exist only in
`libs/types-live` — which the new-architecture layers are forbidden to import. There is no
`domain/entity/account` or `domain/entity/operation` yet.

So `libs/` is forced rather than chosen, and this package should move once those types have a
non-legacy home.

## Why a package rather than a module in `live-common`

`live-common` no longer accepts new top-level modules, and this code is deliberately free of
coin-module imports so it stays cheap to load. It must **not** depend on `live-common` —
`live-common` depends on it, so that edge would be a cycle.

For the same reason a transaction is read through the structural `TransactionLike` rather
than any family's `Transaction` union: the seam hands over whichever shape the route
produced, and reading two fields off it should not pull in a family layer.

## The two stages, and why they see different things

`signOperation` receives the rich transaction; `broadcast` receives only the signed
operation. That asymmetry drives the whole design:

| | sign | broadcast |
|---|---|---|
| action wording | the family's own `mode` / `model.kind` | an `OperationType` |
| delegation target | read from the transaction | only if the family copies it into `Operation.extra` |
| originating route | not known (no `broadcastConfig`) | attributed from `broadcastConfig.source` |

So there are two derivations, `deriveEarnTransactionType` (sign) and
`deriveFromOperationType` (broadcast), and a test asserts they agree per family. Without the
second one a successful Solana stake would derive no action at all and be dropped, because
its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

`dataSource` on every event records which of the two produced it.

## Emission policy

An event is only forwarded to analytics when a **staking action was derived**. Plain sends
and swaps derive nothing and are silently ignored, so no currency allowlist is needed and a
newly-enabled staking currency is covered automatically. Transactions originating from the
Earn live-app are skipped as well — that app emits `earn_transaction_*` itself with richer
context, and counting both would double-count.

## Consent is the sink's job, not this package's

`emitTransactionEvent` fires from the bridge seam **unconditionally**. This package has no
access to the host's settings — it cannot read Redux — so it does not and cannot decide whether
a user agreed to be measured. Every registered observer gates itself.

That is deliberate rather than an oversight, because there is no single gate to inherit:

| Sink | Governed by |
|---|---|
| Segment / Mixpanel | the analytics opt-in (`trackingEnabled`) |
| Datadog | the crash/error-reporting opt-in, plus its own feature flag |
| a dev console logger | nothing — it never leaves the process |

Those are **different user choices**. Someone can accept crash reporting and decline analytics,
or the reverse, so a Datadog sink must not assume the Segment sink's gate.

Today both transmitting observers forward through their host's `track`, whose first statement is
the analytics-consent check, so consent is enforced without either observer implementing it.
A future sink that talks to a service directly has to do its own check.

One thing to know if you ever reach for it: the hosts' `track(event, properties, mandatory)`
takes a third argument that bypasses the consent check and swaps in a reduced property set. It
exists for recording the consent change itself and is not a general-purpose escape hatch —
using it for funnel data is a privacy decision, not an engineering one.

## Adding a family

1. Add its staking `mode` values to `FAMILY_ACTIONS` in `earnTransactionType.ts`.
2. Add the `OperationType`s its optimistic operations carry to `operationType.ts`, read from
   the coin module's `buildOptimisticOperation` — not guessed.
3. Add a row to the matrix in `stakingMatrix.test.ts`. The consistency test will fail if the
   two derivations disagree.
