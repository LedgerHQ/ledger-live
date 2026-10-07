import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { AleoAccount, AleoTokenAccount, Transaction as AleoTransaction } from "../types";
import {
  derivePrivateTransactionMode,
  derivePublicTransactionMode,
  isPrivateTransaction,
  isSelfTransferTransaction,
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

type AleoBalances = Readonly<{
  transparentBalance: BigNumber;
  privateBalance: BigNumber | null;
}>;

function isAleoMainAccount(account: AccountLike): account is AleoAccount {
  return account.type === "Account" && account.currency.family === "aleo";
}

function isAleoTokenAccount(account: AccountLike): account is AleoTokenAccount {
  return (
    account.type === "TokenAccount" &&
    "transparentBalance" in account &&
    BigNumber.isBigNumber(account.transparentBalance)
  );
}

export function isAleoTransaction(transaction: unknown): transaction is AleoTransaction {
  return (
    typeof transaction === "object" &&
    transaction !== null &&
    "family" in transaction &&
    transaction.family === "aleo"
  );
}

function getBalances(account: AccountLike): AleoBalances | null {
  if (isAleoTokenAccount(account)) {
    return {
      transparentBalance: account.transparentBalance,
      privateBalance: account.privateBalance,
    };
  }

  if (isAleoMainAccount(account) && account.aleoResources) {
    return {
      transparentBalance: account.aleoResources.transparentBalance,
      privateBalance: account.aleoResources.privateBalance,
    };
  }

  return null;
}

function resolveSource(transaction: AleoTransaction): AleoBalanceSource {
  return isPrivateTransaction(transaction) ? PRIVATE : PUBLIC;
}

function buildModePatch(
  source: AleoBalanceSource,
  transaction: AleoTransaction,
  isSelfTransfer: boolean,
): TransactionPatch {
  const isTokenTx = Boolean(transaction.subAccountId);

  if (source === PUBLIC) {
    return {
      mode: derivePublicTransactionMode({ isTokenTx, isSelfTransfer }),
      properties: undefined,
    };
  }

  return {
    mode: derivePrivateTransactionMode({ isTokenTx, isSelfTransfer }),
    properties: isPrivateTransaction(transaction)
      ? transaction.properties
      : { amountRecordCommitments: [], feeRecordCommitment: null },
  };
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
    },
    {
      id: PRIVATE,
      translationKey: "balanceType.aleoPrivate",
      balance: balances.privateBalance,
      hasPendingBalance: false,
      icon: "lock",
    },
  ];
}

function getSelectedOptionId(transaction: unknown): string | null {
  return isAleoTransaction(transaction) ? resolveSource(transaction) : null;
}

function buildSelectionPatch(optionId: string, transaction: unknown): TransactionPatch {
  if (!isAleoTransaction(transaction) || (optionId !== PUBLIC && optionId !== PRIVATE)) return {};

  const keepsSelfTransfer =
    resolveSource(transaction) === optionId && isSelfTransferTransaction(transaction);
  return buildModePatch(optionId, transaction, keepsSelfTransfer);
}

function getSelfTransferTarget({
  account,
  transaction,
}: {
  account: AccountLike;
  transaction: unknown;
}): BalanceTypeSelfTransferTarget | null {
  if (!isAleoMainAccount(account) || !isAleoTransaction(transaction)) return null;
  if (!account.freshAddress || account.aleoResources?.privateBalance == null) return null;

  if (resolveSource(transaction) === PUBLIC) {
    return {
      address: account.freshAddress,
      translationKey: "recipient.selfTransfer.toPrivate",
      isDestinationPublic: false,
    };
  }

  return {
    address: account.freshAddress,
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
  if (!isAleoTransaction(transaction)) return {};
  if (isSelfTransferTransaction(transaction) === isSelfTransfer) return {};
  return buildModePatch(resolveSource(transaction), transaction, isSelfTransfer);
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
  if (optionId === PRIVATE) return balances.privateBalance ?? new BigNumber(0);
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
