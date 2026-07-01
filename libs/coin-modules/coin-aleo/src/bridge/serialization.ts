import BigNumber from "bignumber.js";
import type { AccountRaw, Account, TokenAccount, TokenAccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type {
  AleoAccount,
  AleoAccountRaw,
  AleoResources,
  AleoResourcesRaw,
  AleoTokenAccount,
  AleoTokenAccountRaw,
  AleoOperationExtra,
  AleoOperationExtraRaw,
} from "../types";
import { isAleoOperationExtra, isAleoOperationExtraRaw } from "../types";

export function toAleoResourcesRaw(resources: AleoResources): AleoResourcesRaw {
  return {
    transparentBalance: resources.transparentBalance.toString(),
    privateBalance: resources.privateBalance?.toString() ?? null,
    provableApi: resources.provableApi ? JSON.stringify(resources.provableApi) : null,
    lastPrivateSyncDate: resources.lastPrivateSyncDate
      ? resources.lastPrivateSyncDate.toISOString()
      : null,
    unspentPrivateRecords: resources.unspentPrivateRecords
      ? JSON.stringify(resources.unspentPrivateRecords)
      : null,
    ...(typeof resources.hasMigratedPublicTokens === "boolean" && {
      hasMigratedPublicTokens: resources.hasMigratedPublicTokens,
    }),
    ...(typeof resources.hasMigratedPrivateTokens === "boolean" && {
      hasMigratedPrivateTokens: resources.hasMigratedPrivateTokens,
    }),
  };
}

export function fromAleoResourcesRaw(rawResources: AleoResourcesRaw): AleoResources {
  return {
    transparentBalance: new BigNumber(rawResources.transparentBalance),
    privateBalance: rawResources.privateBalance ? new BigNumber(rawResources.privateBalance) : null,
    provableApi: rawResources.provableApi ? JSON.parse(rawResources.provableApi) : null,
    lastPrivateSyncDate: rawResources.lastPrivateSyncDate
      ? new Date(rawResources.lastPrivateSyncDate)
      : null,
    unspentPrivateRecords: rawResources.unspentPrivateRecords
      ? JSON.parse(rawResources.unspentPrivateRecords)
      : null,
    ...(typeof rawResources.hasMigratedPublicTokens === "boolean" && {
      hasMigratedPublicTokens: rawResources.hasMigratedPublicTokens,
    }),
    ...(typeof rawResources.hasMigratedPrivateTokens === "boolean" && {
      hasMigratedPrivateTokens: rawResources.hasMigratedPrivateTokens,
    }),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const aleoAccount = account as AleoAccount;
  const aleoAccountRaw = accountRaw as AleoAccountRaw;

  if (aleoAccount.aleoResources) {
    aleoAccountRaw.aleoResources = toAleoResourcesRaw(aleoAccount.aleoResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const aleoAccount = account as AleoAccount;
  const aleoAccountRaw = accountRaw as AleoAccountRaw;

  if (aleoAccountRaw.aleoResources) {
    aleoAccount.aleoResources = fromAleoResourcesRaw(aleoAccountRaw.aleoResources);
  }
}

export function assignToTokenAccountRaw(
  tokenAccount: TokenAccount,
  tokenAccountRaw: TokenAccountRaw,
): void {
  const aleoTokenAccount = tokenAccount as AleoTokenAccount;
  const aleoTokenAccountRaw = tokenAccountRaw as AleoTokenAccountRaw;
  aleoTokenAccountRaw.transparentBalance = aleoTokenAccount.transparentBalance.toString();
  aleoTokenAccountRaw.privateBalance = aleoTokenAccount.privateBalance?.toString() ?? null;
  aleoTokenAccountRaw.unspentPrivateRecords = aleoTokenAccount.unspentPrivateRecords
    ? JSON.stringify(aleoTokenAccount.unspentPrivateRecords)
    : null;
}

export function assignFromTokenAccountRaw(
  tokenAccountRaw: TokenAccountRaw,
  tokenAccount: TokenAccount,
): void {
  const aleoTokenAccount = tokenAccount as AleoTokenAccount;
  const aleoTokenAccountRaw = tokenAccountRaw as AleoTokenAccountRaw;
  aleoTokenAccount.transparentBalance = new BigNumber(aleoTokenAccountRaw.transparentBalance ?? 0);
  aleoTokenAccount.privateBalance = aleoTokenAccountRaw.privateBalance
    ? new BigNumber(aleoTokenAccountRaw.privateBalance)
    : null;
  aleoTokenAccount.unspentPrivateRecords = aleoTokenAccountRaw.unspentPrivateRecords
    ? JSON.parse(aleoTokenAccountRaw.unspentPrivateRecords)
    : null;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  if (!isAleoOperationExtra(extra)) {
    throw new Error("Unsupported OperationExtra");
  }

  const extraRaw: AleoOperationExtraRaw = {
    functionId: extra.functionId,
    transactionType: extra.transactionType,
    ...(extra.patched !== undefined && { patched: extra.patched }),
    ...(extra.programId !== undefined && { programId: extra.programId }),
  };

  if (extra.estimatedBondedAmount) {
    extraRaw.estimatedBondedAmount = extra.estimatedBondedAmount.toString();
  }
  if (extra.estimatedUnbondedAmount) {
    extraRaw.estimatedUnbondedAmount = extra.estimatedUnbondedAmount.toString();
  }
  if (extra.estimatedWithdrawUnbondedAmount) {
    extraRaw.estimatedWithdrawUnbondedAmount = extra.estimatedWithdrawUnbondedAmount.toString();
  }

  return extraRaw;
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  if (!isAleoOperationExtraRaw(extraRaw)) {
    throw new Error("Unsupported OperationExtraRaw");
  }

  const extra: AleoOperationExtra = {
    functionId: extraRaw.functionId,
    transactionType: extraRaw.transactionType,
    ...(extraRaw.patched !== undefined && { patched: extraRaw.patched }),
    ...(extraRaw.programId !== undefined && { programId: extraRaw.programId }),
  };

  if (extraRaw.estimatedBondedAmount) {
    extra.estimatedBondedAmount = new BigNumber(extraRaw.estimatedBondedAmount);
  }
  if (extraRaw.estimatedUnbondedAmount) {
    extra.estimatedUnbondedAmount = new BigNumber(extraRaw.estimatedUnbondedAmount);
  }
  if (extraRaw.estimatedWithdrawUnbondedAmount) {
    extra.estimatedWithdrawUnbondedAmount = new BigNumber(extraRaw.estimatedWithdrawUnbondedAmount);
  }

  return extra;
}
