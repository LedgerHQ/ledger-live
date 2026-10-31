import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "./buildSubAccounts";
import { CARDANO_MAX_SUPPLY } from "./constants";
import {
  decodeTokenName,
  getAccountStakeCredential,
  getBech32DRepId,
  getBech32PoolId,
  getBipPathString,
} from "./logic";
import { CardanoAccount, CardanoResources, Transaction, TransactionStatus } from "./types";

function getTokenSendFields(
  account: TokenAccount,
  mainAccount: Account,
  transaction: Transaction,
  cardanoResources: CardanoResources,
): DeviceTransactionField[] {
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

  const recipient = TyphonUtils.getAddressFromString(transaction.recipient);
  const requiredMinAdaForTokens = TyphonUtils.calculateMinUtxoAmountBabbage(
    {
      address: recipient,
      amount: new BigNumber(CARDANO_MAX_SUPPLY),
      tokens: tokensToSend,
    },
    new BigNumber(cardanoResources.protocolParams.utxoCostPerByte),
  );
  return [
    {
      type: "text",
      label: "ADA",
      value: formatCurrencyUnit(getAccountCurrency(mainAccount).units[0], requiredMinAdaForTokens, {
        showCode: true,
        disableRounding: true,
      }),
    },
    {
      type: "text",
      label: "Token Name",
      value: decodeTokenName(assetName),
    },
    {
      type: "amount",
      label: "Amount",
      value: formatCurrencyUnit(getAccountCurrency(account).units[0], transactionAmount, {
        showCode: true,
        disableRounding: true,
      }),
    },
  ];
}

function getDRepLabel(transaction: Transaction, currencyId: string): string {
  if (transaction.dRepAbstain) return "Always abstain";
  if (transaction.dRepNoConfidence) return "Always no confidence";
  // getTransactionStatus guarantees exactly one vote option is set
  return getBech32DRepId(transaction.dRepHex!, currencyId);
}

async function getDeviceTransactionConfig({
  account,
  transaction,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const { mode } = transaction;
  const fields: DeviceTransactionField[] = [];
  const mainAccount = getMainAccount(account, parentAccount);
  const cardanoResources = (mainAccount as CardanoAccount).cardanoResources;

  const { fees } = transaction;
  if (fees) {
    fields.push({
      type: "text",
      label: "Transaction Fee",
      value: formatCurrencyUnit(getAccountCurrency(mainAccount).units[0], fees, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  if (mode === "send") {
    if (account.type === "TokenAccount") {
      fields.push(...getTokenSendFields(account, mainAccount, transaction, cardanoResources));
    } else if (account.type === "Account") {
      fields.push({
        type: "amount",
        label: "Amount",
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
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
  } else if (mode === "voteDelegate" && account.type === "Account") {
    const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
    fields.push(
      {
        type: "text",
        label: "Staking key",
        value: getBipPathString({
          account: stakeCredential.path.account,
          chain: stakeCredential.path.chain,
          index: stakeCredential.path.index,
        }),
      },
      {
        type: "text",
        label: "DRep",
        value: getDRepLabel(transaction, account.currency.id),
      },
    );
  }

  return fields;
}

export default getDeviceTransactionConfig;
