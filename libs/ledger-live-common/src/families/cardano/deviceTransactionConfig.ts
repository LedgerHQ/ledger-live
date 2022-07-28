import BigNumber from "bignumber.js";
import { getAccountUnit, getMainAccount } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { DeviceTransactionField } from "../../transaction";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { CardanoAccount, Transaction, TransactionStatus } from "./types";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { decodeTokenName } from "./logic";

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

  if (mode === "send") {
    if (account.type === "TokenAccount") {
      const cardanoResources = (mainAccount as CardanoAccount).cardanoResources;

      const { assetId } = decodeTokenCurrencyId(account.token.id);
      const { policyId, assetName } = decodeTokenAssetId(assetId);
      const transactionAmount = transaction.useAllAmount
        ? account.balance
        : transaction.amount;
      const { fees } = transaction;

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
        label: "ADA",
        value: formatCurrencyUnit(
          getAccountUnit(mainAccount),
          requiredMinAdaForTokens,
          { showCode: true, disableRounding: true }
        ),
      });
      fields.push({
        type: "text",
        label: "Token Name",
        value: decodeTokenName(assetName),
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountUnit(account), transactionAmount, {
          showCode: true,
          disableRounding: true,
        }),
      });
      if (fees) {
        fields.push({
          type: "text",
          label: "Fees",
          value: formatCurrencyUnit(getAccountUnit(mainAccount), fees, {
            showCode: true,
            disableRounding: true,
          }),
        });
      }
    } else if (account.type === "Account") {
      const { fees } = transaction;
      const transactionAmount = transaction.useAllAmount
        ? account.balance
        : transaction.amount;
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountUnit(account), transactionAmount, {
          showCode: true,
          disableRounding: true,
        }),
      });
      if (fees) {
        fields.push({
          type: "text",
          label: "Fees",
          value: formatCurrencyUnit(getAccountUnit(account), fees, {
            showCode: true,
            disableRounding: true,
          }),
        });
      }
    }
  }

  return fields;
}

export default getDeviceTransactionConfig;
