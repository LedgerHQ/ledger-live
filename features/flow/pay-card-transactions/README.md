# @features/flow-pay-card-transactions

Pay Card Transactions flow: displays card transaction history for Ledger Wallet.

```ts
import { CardTransactions, useCardTransactionsViewModel } from "@features/flow-pay-card-transactions";

<CardTransactions />
```

`CardTransactions` displays the first page of card transactions. With no transactions it renders
nothing. It uses
`useCardTransactionsViewModel`, which reads `getCardTransactions`
([`@domain/api-card-management`](../../../domain/api/card-management/README.md)) while a Card
session is live, and answers one item per transaction:

| Field           | What it holds                                                       |
| --------------- | ------------------------------------------------------------------- |
| `transaction`   | The transaction as the API package narrowed it                      |
| `categoryLabel` | That category translated, from `payTab.cardTransactions.categories` |

The provider classifies each charge through `transaction.mccCategory`; the numeric MCC is dropped
by the API package before the cache.

Signed out, the query is skipped, so a host composing this flow around a signed-out session provokes
no 401.

Hosts may pass `formatters.amount` and `formatters.date`. Amounts fall back to `"<value> <CURRENCY>"`.
Dates fall back to the runtime locale's medium date. Desktop should pass `useDateFormatter` so the
region locale and Thai Gregorian calendar apply.

Transaction rows can be selected through `onTransactionPress`. On web, selecting one also opens a
Lumen dialog; on native the host opens `CardTransactionDetail` in its own navigation shell. The
detail shows the merchant, relative date and time, amount, status, masked card, funding source and
copyable processor transaction ID. A platform-specific clipboard adapter keeps that side effect out
of the view. Hosts only provide locale-aware amount and date formatters and, on web, the injected
tracking callback.

## Mocked transactions

`GET /v1/card/transactions` is mocked in both apps when MSW is enabled (`MSW_ENABLED=true` on
mobile), from `@domain/api-card-management/mock/card-transactions`. That page holds one transaction
per category, so every label can be seen without a funded card.
