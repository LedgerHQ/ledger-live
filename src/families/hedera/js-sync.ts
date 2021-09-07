import { Observable } from "rxjs";
import { Account, SyncConfig } from "../../types";
import { getOperationsForAccount } from "./api/mirror";
import { getAccountBalance } from "./api/network";

export default function sync(
  initialAccount: Account,
  syncConfig: SyncConfig
): Observable<(account: Account) => Account> {
  return new Observable((o) => {
    void async function () {
      try {
        let accountBalance = await getAccountBalance(initialAccount.seedIdentifier);

        let atMostOperations = syncConfig.paginationConfig.operationsPerAccountId?.[initialAccount.id] 
          ?? syncConfig.paginationConfig.operations 
          ?? 50;

        let operations = await getOperationsForAccount(
          initialAccount.id, 
          initialAccount.seedIdentifier, 
          atMostOperations
        );

        o.next((acc: Account) => ({
          ...acc,

          balance: accountBalance.balance,
          spendableBalance: accountBalance.balance,
          operations,
          blockHeight: 10,
          lastSyncDate: new Date(),
        } as Account));

        o.complete();
      } catch (err) {
        o.error(err);
      }
    }();
  });
}
