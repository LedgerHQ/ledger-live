import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { Account } from "@ledgerhq/types-live";

type UseBridgeMemoTagValidationProps = {
  account: Account;
  parentAccount: Account;
};

export async function useBridgeMemoTagValidation({
  account,
  parentAccount,
}: UseBridgeMemoTagValidationProps) {
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  let transaction = bridge.createTransaction(mainAccount);
  transaction = bridge.updateTransaction(transaction, {});

  const preparedTransaction = await bridge.prepareTransaction(mainAccount, transaction);
  const status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);

  return {
    errors: status.errors,
  };
}
