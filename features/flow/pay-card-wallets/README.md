# @features/flow-pay-card-wallets

> [!CAUTION]
> **Status: UNSTABLE** — Under active development.

The custodial wallets funding the Pay card: which ones are linked, what they hold, and which Ledger
currency each one is. It also carries the cashback the card has earned, resolved the same way.

Two Baanx endpoints have to be read together, because neither answers the question alone:

| Endpoint | Carries | Missing |
| -------- | ------- | ------- |
| `GET /v1/wallet/internal` | every custodial wallet, **with balances** | which ones fund the card |
| `GET /v1/wallet/internal/card_linked` | the linked ones, **in charging order** | balances |

`id` joins them. Both live in [`@domain/api-card-management`](../../../domain/api/card-management/README.md);
this package owns the join and the ordering.

- `combineCardLinkedWallets` — pure. Takes both lists and a map of Ledger id to currency, and
  returns the linked wallets in charging order, each carrying the currency its asset resolved to.
- `useCardLinkedWallets` — runs both reads in parallel and memoizes the join.

## Cashback

`GET /v1/card/cashback` answers one object rather than a list: what the card has earned so far,
the asset it is paid in, and the rate it earns at. The asset is a `currency` and a `network`, either
of which may be absent or `null`; without a currency the reward banner stays hidden.

```json
{ "amount": "0.00294697", "currency": "BTC", "network": "bitcoin", "ratePercent": "1" }
```

- `useCardCashback` — reads it and attaches the resolved currency. It takes the same
  `currencies` map as the linked wallets, since the cashback is paid in one of the card's
  supported assets, and a `skip` flag for a signed-out holder.

It returns `cashback` (absent until the read lands, and on a failed read), `isLoading` and
`isError`. `amount` and `ratePercent` stay the strings the provider sent; `ledgerId` and
`ledgerCurrency` follow the same rules as a linked wallet's, below.

## Pricing happens outside this package

Balances arrive as **per-currency decimal strings** (`"125.40"` of `usdc`), so any total is only
meaningful in one currency. Converting needs the countervalues state holding the rates, which the
two apps reach differently — mobile keeps its extra tracking pairs in a `BehaviorSubject`, desktop
in a Redux slice. So this package carries `ledgerCurrency` and stops there; the app prices it.

The raw decimal string is never parsed here — it is carried as it came off the wire, so nothing
rounds a balance on the way through.

Resolving a Ledger id to a currency is
[`useCurrenciesByIds`](../../platform/currencies/README.md): coins from the crypto registry, tokens
from CAL. A wallet whose asset the catalog does not cover has no `ledgerId`, and one CAL has not
answered for yet has no `ledgerCurrency`.

## A link with no balance is kept

A link with no matching custodial wallet stays in `wallets` with a `null` balance rather than being
dropped: the provider disagreeing with itself is worth showing. A `"0.00"` balance is not a missing
one.
