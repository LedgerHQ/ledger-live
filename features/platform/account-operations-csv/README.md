# @features/platform-account-operations-csv

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Builds the operations history CSV of accounts from the account data (the `operations` kind of
[the new account model](../../../docs/account-models/README.md)), for the history export of both
apps.

`exportAccountsOperationsCsv(accounts, options)` is a thunk. For each requested account (legacy id,
display name and the xpub or address shown in the CSV), it reads every page of its operations again, valued in the fiat countervalue,
then writes them with the 12 columns of the history CSV. It rejects when an account is unknown or
one of its reads fails, so a partial history is never written.

```ts
const csv = await dispatch(
  exportAccountsOperationsCsv([{ id, name, xpub }], {
    countervalueCurrency,
    countervalues, // the rates the app holds, for the value at export time
    findCurrency, // the currency of a coin or token id; a failed lookup rejects the export
  }),
);
```

The store needs the `accountData`, `accountOperations` and `accountEntries` slices, and the account
data router in the thunk `extraArgument` (`accountDataExtra`). Pending operations are left out.
