import { reduce } from "rxjs/operators";
import { Account } from "@ledgerhq/types-live";
import { fromAccountRaw } from "../../account";
import { getAccountBridge } from "../../bridge";
import { accountDataToAccount, accountToAccountData } from "../../cross";
import "../../__tests__/test-helpers/setup";
import { bitcoin1 } from "@ledgerhq/coin-bitcoin/datasets/bitcoin";
import { firstValueFrom } from "rxjs";

async function syncAccount(initialAccount: Account): Promise<Account> {
  const acc = await firstValueFrom(
    getAccountBridge(initialAccount)
      .sync(initialAccount, {
        paginationConfig: {},
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), initialAccount)),
  );
  return acc;
}

async function crossAccount(account: Account): Promise<Account> {
  const a = accountDataToAccount(accountToAccountData(account));
  const synced = await syncAccount(a);
  return synced;
}

test("account.used is true after crossAccount", async () => {
  let account = fromAccountRaw(bitcoin1);
  account = await crossAccount(account);
  expect(account.used).toBe(true);
});
