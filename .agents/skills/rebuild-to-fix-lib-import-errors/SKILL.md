---
name: rebuild-to-fix-lib-import-errors
description: When typecheck finds an error importing from a lib in the monorepo, rebuild the lib
---

When typecheck finds an error importing from a lib in the monorepo rebuild the lib using the command below:

```shell
nx run @ledgerhq/name_of_lib_here:build
```

## Example

### `ledger-wallet-framework` has been updated and the import in `live-common` is erroring

We run `typecheck` and get the following error:

> src/families/tron/transaction.ts:2:10 - error TS2305: Module '"@ledgerhq/ledger-wallet-framework/account"' has no exported member 'getAccountCurrency'.
> 2 import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";

We need to rebuild `@ledgerhq/ledger-wallet-framework`

```shell
nx run @ledgerhq/ledger-wallet-framework:build
```
