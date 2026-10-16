# @devtools/account-data

> [!CAUTION]
> **Status: EXPLORATION.**

Lists the entries of the accounts slice and shows, as stored, what the `accountData` status, `accountBalances` and `accountOperations` slices hold for each. It reads balances and operations through the account data layer on demand. It joins nothing: no countervalue, no unit, no name.

Web only. Its props are built in `@devtools/bindings` (`useAccountDataToolProps`).

## Import boundaries

This tool imports no `@devtools/*` package. Every other `@devtools/*` import is forbidden, see the `devtools-import-boundary` rule.
