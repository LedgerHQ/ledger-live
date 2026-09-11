# @features/flow-pay-card-transactions

Pay Card Transactions flow: displays card transaction history for Ledger Wallet.

```ts
import { useCardTransactionsViewModel } from "@features/flow-pay-card-transactions";
```

`useCardTransactionsViewModel` reads the first page of `getCardTransactions`
([`@domain/api-card-management`](../../../domain/api/card-management/README.md)) while a Card
session is live, and answers one item per transaction:

| Field           | What it holds                                                       |
| --------------- | ------------------------------------------------------------------- |
| `transaction`   | The transaction as the API package narrowed it                      |
| `category`      | `PayCardTransactionCategory` — the provider's own spend grouping    |
| `categoryLabel` | That category translated, from `payTab.cardTransactions.categories` |

The provider classifies each charge itself and sends the label on the transaction, so `categoryOf`
reads it rather than deriving one from the numeric MCC, which the API package drops before the
cache. `transactionHasCategory` is the same answer as a predicate, for filtering.

Signed out, the query is skipped and the list reads empty, so a host composing this flow around a
signed-out session provokes no 401.

## Mocked transactions

`GET /v1/card/transactions` is mocked in both apps when MSW is enabled (`MSW_ENABLED=true` on
mobile), from `@domain/api-card-management/mock/card-transactions`. That page holds one transaction
per category, so every label can be seen without a funded card.
