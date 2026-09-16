# @features/flow-pay-card-transactions

Pay Card Transactions flow: displays card transaction history for Ledger Wallet.

```ts
import { CardTransactions, useCardTransactionsViewModel } from "@features/flow-pay-card-transactions";

<CardTransactions />
```

`CardTransactions` displays the card transactions read so far, a page at a time. With no
transactions it renders nothing. It uses
`useCardTransactionsViewModel`, which reads `getCardTransactions`
([`@domain/api-card-management`](../../../domain/api/card-management/README.md)) while a Card
session is live, and answers one item per transaction:

| Field           | What it holds                                                       |
| --------------- | ------------------------------------------------------------------- |
| `transaction`   | The transaction as the API package narrowed it                      |
| `categoryLabel` | That category translated, from `payTab.cardTransactions.categories` |

The first page arrives on its own. `loadMore` reads the next one and appends it, and is `undefined`
once the provider has none left; `isLoadingMore` is true while one is on its way. No surface calls
it yet — that control belongs with the full history, not with this summary. Where the list ends is
the API package's to work out, and it is not obvious: see
[Paging the transaction history](../../../domain/api/card-management/README.md#paging-the-transaction-history).

A page that fails after earlier ones landed leaves the list as it was rather than blanking it, so
the transactions already read stay on screen.

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
mobile), from `@domain/api-card-management/mock/card-transactions`. The mock holds one transaction
per category and serves them six to a page, answering a page past the end with an empty array as
the provider does. Eight charges six to a page therefore make two — so the last two category labels
only appear once a surface reads the second page.

The devtool's own answer wins when it has set one, so `fill`, `empty` and `receive` still decide
what is paged.
