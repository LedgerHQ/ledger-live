# @features/flow-pay-card-wallets

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

The custodial wallets funding the Pay card: which ones are linked, what they hold, and what the card
can spend in total.

Two Baanx endpoints have to be read together, because neither answers the question alone:

| Endpoint | Carries | Missing |
| -------- | ------- | ------- |
| `GET /v1/wallet/internal` | every custodial wallet, **with balances** | which ones fund the card |
| `GET /v1/wallet/internal/card_linked` | the linked ones, **in charging order** | balances |

`id` joins them. Both live in [`@domain/api-card-management`](../../../domain/api/card-management/README.md);
this package owns the join, the ordering and the total.

- `combineCardLinkedWallets` — pure. Takes both lists and a counter-value resolver, returns the
  linked wallets in charging order plus the total.
- `useCardLinkedWallets` — runs both reads in parallel and memoizes the join.

## The counter-value resolver is a port

Balances arrive as **per-currency decimal strings** (`"125.40"` of `usdc`), so a total is only
meaningful in one currency. Converting needs two things this package deliberately does not have:
the asset catalogue that maps Baanx's `currency`/`network` pair onto a Ledger currency, and the
countervalues state holding the rates. Both belong to the app, so the conversion arrives as
`ResolveWalletCounterValue` and the package stays free of that graph.

The raw decimal string is never parsed here — it is handed to the resolver as it came off the wire,
so nothing rounds a balance on the way through.

## `isPartialTotal` means the total is understating

A wallet contributes nothing to `total` when its balance has not arrived, when no custodial wallet
matched the link, or when the resolver has no rate for its asset. Any of those sets
`isPartialTotal`, because a total that silently omits a funding source is worse than one that says
it is incomplete. A link with no matching balance is **kept** in `wallets` with a `null` balance
rather than dropped: the provider disagreeing with itself is worth showing.

A `"0.00"` balance is not a missing one — it converts to `0` and leaves `isPartialTotal` alone.

A resolver that answers `NaN` or `Infinity` counts as no rate at all. Left alone it would poison
`total` while `isPartialTotal` still read `false`, which is the one combination this type is
supposed to make impossible.
