import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { TRANSACTION_TYPE } from "../constants";
import type { AleoUnspentRecord, Transaction as AleoTransaction } from "../types";
import {
  derivePrivateTransactionMode,
  derivePublicTransactionMode,
  getMaxPrivateRecordsForAccount,
  isAleoAccount,
  isPrivateTransaction,
  isSelfTransferTransaction,
  selectPrivateRecordsForAmount,
  sumPrivateRecords,
} from "../utils";
import type {
  BalanceTypeConfig,
  BalanceTypeOption,
  BalanceTypeSelfTransferTarget,
  TransactionPatch,
} from "../../../bridge/descriptor/types";

type AleoBalanceSource = "public" | "private";

const PUBLIC: AleoBalanceSource = "public";
const PRIVATE: AleoBalanceSource = "private";

const EMPTY_PRIVATE_PROPERTIES = { amountRecordCommitments: [], feeRecordCommitment: null };

type AleoBalances = Readonly<{
  transparentBalance: BigNumber;
  privateBalance: BigNumber | null;
  unspentPrivateRecords: AleoUnspentRecord[];
  maxPrivateRecords: number;
}>;

export function isAleoFlowTransaction(transaction: unknown): transaction is AleoTransaction {
  return (
    typeof transaction === "object" &&
    transaction !== null &&
    "family" in transaction &&
    transaction.family === "aleo"
  );
}

function getBalances(account: AccountLike): AleoBalances | null {
  if (!isAleoAccount(account)) return null;

  if (account.type === "TokenAccount") {
    return {
      transparentBalance: account.transparentBalance,
      privateBalance: account.privateBalance,
      unspentPrivateRecords: account.unspentPrivateRecords ?? [],
      maxPrivateRecords: getMaxPrivateRecordsForAccount(account),
    };
  }

  if (!account.aleoResources) return null;

  return {
    transparentBalance: account.aleoResources.transparentBalance,
    privateBalance: account.aleoResources.privateBalance,
    unspentPrivateRecords: account.aleoResources.unspentPrivateRecords ?? [],
    maxPrivateRecords: getMaxPrivateRecordsForAccount(account),
  };
}

function resolveSource(transaction: AleoTransaction): AleoBalanceSource {
  return isPrivateTransaction(transaction) ? PRIVATE : PUBLIC;
}

function getOptions({ account }: { account: AccountLike }): readonly BalanceTypeOption[] {
  const balances = getBalances(account);
  if (!balances) return [];

  return [
    {
      id: PUBLIC,
      translationKey: "balanceType.aleoPublic",
      balance: balances.transparentBalance,
      hasPendingBalance: false,
      icon: "check",
      hideSubtitle: true,
    },
    {
      id: PRIVATE,
      translationKey: "balanceType.aleoPrivate",
      balance: balances.privateBalance,
      hasPendingBalance: false,
      icon: "lock",
      hideSubtitle: true,
    },
  ];
}

function getSelectedOptionId(transaction: unknown): string | null {
  return isAleoFlowTransaction(transaction) ? resolveSource(transaction) : null;
}

function buildSelectionPatch(optionId: string): TransactionPatch {
  if (optionId === PUBLIC) {
    return { mode: TRANSACTION_TYPE.TRANSFER_PUBLIC, properties: undefined };
  }

  if (optionId === PRIVATE) {
    return { mode: TRANSACTION_TYPE.TRANSFER_PRIVATE, properties: EMPTY_PRIVATE_PROPERTIES };
  }

  return {};
}

function getSelfTransferAddress(
  account: AccountLike,
  parentAccount: Account | null | undefined,
): string | null {
  if (!isAleoAccount(account)) return null;

  if (account.type === "Account") {
    if (account.aleoResources?.privateBalance == null) return null;
    return account.freshAddress || null;
  }

  if (account.privateBalance == null) return null;
  if (!parentAccount || parentAccount.id !== account.parentId) return null;
  return parentAccount.freshAddress || null;
}

function getSelfTransferTarget({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: unknown;
}): BalanceTypeSelfTransferTarget | null {
  if (!isAleoFlowTransaction(transaction)) return null;
  const address = getSelfTransferAddress(account, parentAccount);
  if (!address) return null;

  if (resolveSource(transaction) === PUBLIC) {
    return {
      address,
      translationKey: "recipient.selfTransfer.toPrivate",
      isDestinationPublic: false,
    };
  }

  return {
    address,
    translationKey: "recipient.selfTransfer.toPublic",
    isDestinationPublic: true,
  };
}

function buildSelfTransferPatch({
  isSelfTransfer,
  transaction,
}: {
  isSelfTransfer: boolean;
  transaction: unknown;
}): TransactionPatch {
  if (!isAleoFlowTransaction(transaction)) return {};
  if (isSelfTransferTransaction(transaction) === isSelfTransfer) return {};

  const isTokenTx = Boolean(transaction.subAccountId);

  if (resolveSource(transaction) === PUBLIC) {
    return { mode: derivePublicTransactionMode({ isTokenTx, isSelfTransfer }) };
  }

  return { mode: derivePrivateTransactionMode({ isTokenTx, isSelfTransfer }) };
}

function getSelectableBalance({
  account,
  optionId,
}: {
  account: AccountLike;
  optionId: string;
}): BigNumber {
  const balances = getBalances(account);
  if (!balances) return new BigNumber(0);
  if (optionId === PUBLIC) return balances.transparentBalance;
  if (optionId === PRIVATE) {
    return sumPrivateRecords(
      selectPrivateRecordsForAmount({
        unspentRecords: balances.unspentPrivateRecords,
        targetAmount: null,
        maxRecords: balances.maxPrivateRecords,
      }),
    );
  }
  return new BigNumber(0);
}

export const aleoBalanceTypeConfig: BalanceTypeConfig = {
  getOptions,
  getSelectedOptionId,
  buildSelectionPatch,
  getSelfTransferTarget,
  buildSelfTransferPatch,
  getSelectableBalance,
};
