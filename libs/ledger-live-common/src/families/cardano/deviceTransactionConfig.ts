import BigNumber from "bignumber.js";
import { getAccountUnit, getMainAccount } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { DeviceTransactionField } from "../../transaction";
import { Account, AccountLike, TransactionStatus } from "../../types";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { CardanoResources, Transaction } from "./types";
import { utils as TyphonUtils } from "@stricahq/typhonjs";

function getDeviceTransactionConfig({
  account,
  transaction,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode } = transaction;
  const fields: DeviceTransactionField[] = [];
  const mainAccount = getMainAccount(account, parentAccount);

  if (mode === "send" && account.type === "TokenAccount") {
    const cardanoResources = mainAccount.cardanoResources as CardanoResources;

    const { assetId } = decodeTokenCurrencyId(account.token.id);
    const { policyId, assetName } = decodeTokenAssetId(assetId);
    const transactionAmount = transaction.useAllAmount
      ? account.balance
      : transaction.amount;

    const tokensToSend = [
      {
        policyId,
        assetName,
        amount: transactionAmount,
      },
    ];

    const requiredMinAdaForTokens = TyphonUtils.calculateMinUtxoAmount(
      tokensToSend,
      new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord)
    );
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(
        getAccountUnit(mainAccount),
        requiredMinAdaForTokens,
        { showCode: true, disableRounding: true }
      ),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
