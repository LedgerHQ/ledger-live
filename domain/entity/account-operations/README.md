# @domain/entity-account-operations

> [!CAUTION]
> **Status: EXPLORATION.** The second slice of the [account domain migration](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7389904957/Account+domain+migration+discovery).

The operation history for wallet accounts: the first slice whose data is **unbounded**, which is
what makes it worth building. See [the account data layer](../../../docs/account-data-layer.md).

## What it owns

```
{
  byAccount: Record<AccountId, {
    operations: AccountOperation[],   // newest first, the loaded window
    nextCursor?: string,              // where the next page resumes
    complete: boolean,                // is this the whole history?
    at?: string,                      // when the head was last read
    total?: number,                   // how many exist, when a source can say
  }>,
  status: Record<AccountId, { pending, error?, sourceId? }>,
}
```

A **window**, not the history. Pretending the table holds everything is what would make every
consumer wrong, so the four fields around `operations` exist to keep it honest.

## Four choices worth knowing about

- **Flat, not nested.** The legacy `Operation` nests `subOperations` (a token transfer inside a
  transaction) and `internalOperations` inside their parent, which is why reading a token account's
  history means walking its parent's. Here they are ordinary rows carrying `parentOperationId`, and a
  sub-operation's `accountId` is the token account's. Nothing has to be walked, and the legacy shape
  can still be reconstructed from the flat one (wallet-cli does exactly that).
- **`assetId` on the row.** Duplicated from the balance entity on purpose: deriving it would mean
  decoding a token account id, which is not decodable, or joining against the balance table, which
  would make a history unrenderable until a balance had been read. Independent loadability is the
  point of the slicing.
- **`at` on the account, not the row.** An operation's `date` is when it happened; it says nothing
  about when we last looked for newer ones. This is the one place the balance slice's freshness rule
  does not transfer.
- **`total` is optional, and usually absent.** A source reading one page cannot know how many
  operations an account has. Returning the loaded count instead would turn every "N transactions"
  label into a lie, so `selectAccountOperationsTotal` returns `undefined` and callers handle it.

## Main exports

| Export | Purpose |
| --- | --- |
| `AccountOperationSchema` | The canonical row, and validation for persisted / untrusted data |
| `accountOperationsSlice` | The RTK slice. Mount its reducer under the `accountOperations` key |
| `accountOperationsRequested` / `accountOperationsReceived` / `accountOperationsFailed` | The three states of a read. `received` **replaces** the window on a head read and **merges** into it on a next page (`append: true`) |
| `accountOperationsBinding` | How the generic read drives this slice, including `selectNextQuery` for the next page |
| `AccountOperationsQuery`, `AccountOperationsPage` | What a source is asked, and what it answers |
| `accountOperationsRemoved`, `accountOperationsReset` | Account removal, profile reset |
| `accountOperationsSlice.selectors` | `selectAccountOperations`, `selectAccountOperationsEntry`, `selectHasMoreAccountOperations`, `selectAccountOperationsTotal`, `selectAccountOperationsStatus`, `selectAccountOperationsAt` |

### Why a head read replaces and a next page merges

A head read is the only honest answer to "what is the history now": there is no cursor meaning
"everything after this", and merging would keep operations a chain reorganisation has since dropped.
A page read is the opposite: it reaches further back into a past that does not change, so it appends,
deduplicating by id because a paginated source can legitimately repeat an operation at a page
boundary.

## What this package deliberately does not know

**What an `Account` is**, and **what a family's `extra` bag contains**. The
`Account → AccountOperation[]` projection lives in
[`libs/ledger-live-common/src/legacy-mapping`](../../../libs/ledger-live-common/src/legacy-mapping);
the family bag is the part of the god object this exercise exists to stop carrying, and a screen that
genuinely needs it is the argument for a *family* slice, not for widening this one.

## Who fills the table

Nothing in this package. It declares the `operations` datum in
[`@domain/entity-account-data`](../account-data) and exports `accountOperationsBinding`. The generic
read in [`@domain/api-account-data-source`](../../api/account-data-source) drives it, head and next
page alike.
