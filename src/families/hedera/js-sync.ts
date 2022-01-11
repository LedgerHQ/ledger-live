import { Observable } from "rxjs";
import { Account } from "../../types";
import { getOperationsForAccount } from "./api/mirror";
import { getAccountBalance } from "./api/network";
import { mergeOps } from "../../bridge/jsHelpers";

export default function sync(
  initialAccount: Account
): Observable<(account: Account) => Account> {
  return new Observable((o) => {
    void (async function () {
      try {
        // get current account balance
        const accountBalance = await getAccountBalance(
          initialAccount.hederaResources!.accountId
        );

        // grab latest operation's consensus timestamp for incremental sync
        const oldOperations = initialAccount.operations ?? [];
        const latestOperationTimestamp = oldOperations[0]?.extra?.consensus_timestamp ?? 0;

        // merge new operations w/ previously synced ones
        const newOperations = await getOperationsForAccount(
          initialAccount.id,
          initialAccount.hederaResources!.accountId!,
          latestOperationTimestamp
        );
        const operations = mergeOps(oldOperations, newOperations);

        o.next(
          (acc: Account) =>
            ({
              ...acc,

              balance: accountBalance.balance,
              spendableBalance: accountBalance.balance,
              operations,
              blockHeight: 10,
              lastSyncDate: new Date(),
            } as Account)
        );

        o.complete();
      } catch (err) {
        o.error(err);
      }
    })();
  });
}
