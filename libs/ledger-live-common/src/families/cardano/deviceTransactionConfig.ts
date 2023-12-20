import BigNumber from "bignumber.js";
import { getAccountUnit, getMainAccount } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { DeviceTransactionField } from "../../transaction";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { CardanoAccount, Transaction, TransactionStatus } from "./types";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import {
  decodeTokenName,
  getAccountStakeCredential,
  getBech32PoolId,
  getBipPathString,
} from "./logic";

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
  const cardanoResources = (mainAccount as CardanoAccount).cardanoResources;

  const { fees } = transaction;
  if (fees) {
    fields.push({
      type: "text",
      label: "Transaction Fee",
      value: formatCurrencyUnit(getAccountUnit(account), fees, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  if (mode === "send") {
    if (account.type === "TokenAccount") {
      const { assetId } = decodeTokenCurrencyId(account.token.id);
      const { policyId, assetName } = decodeTokenAssetId(assetId);
      const transactionAmount = transaction.useAllAmount ? account.balance : transaction.amount;

      const tokensToSend = [
        {
          policyId,
          assetName,
          amount: transactionAmount,
        },
      ];

      const requiredMinAdaForTokens = TyphonUtils.calculateMinUtxoAmount(
        tokensToSend,
        new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord),
      );
      fields.push({
        type: "text",
        label: "ADA",
        value: formatCurrencyUnit(getAccountUnit(mainAccount), requiredMinAdaForTokens, {
          showCode: true,
          disableRounding: true,
        }),
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
    } else if (account.type === "Account") {
      const transactionAmount = transaction.useAllAmount ? account.balance : transaction.amount;
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountUnit(account), transactionAmount, {
          showCode: true,
          disableRounding: true,
        }),
      });
    }
  } else if (mode === "delegate" && account.type === "Account") {
    const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
    fields.push({
      type: "text",
      label: "Staking key",
      value: getBipPathString({
        account: stakeCredential.path.account,
        chain: stakeCredential.path.chain,
        index: stakeCredential.path.index,
      }),
    });
    fields.push({
      type: "text",
      label: "Delegate stake to",
      value: getBech32PoolId(transaction.poolId as string, account.currency.id),
    });
  } else if (mode === "undelegate" && account.type === "Account") {
    const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
    fields.push({
      type: "text",
      label: "Staking key",
      value: getBipPathString({
        account: stakeCredential.path.account,
        chain: stakeCredential.path.chain,
        index: stakeCredential.path.index,
      }),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
