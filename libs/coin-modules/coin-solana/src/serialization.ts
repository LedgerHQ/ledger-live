import {
  SolanaAccount,
  SolanaAccountRaw,
  SolanaOperationExtra,
  SolanaOperationExtraRaw,
  SolanaResources,
  SolanaResourcesRaw,
} from "./types";
import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export function toSolanaResourcesRaw(resources: SolanaResources): SolanaResourcesRaw {
  return {
    stakes: JSON.stringify(resources.stakes),
    unstakeReserve: resources.unstakeReserve.toJSON(),
  };
}

export function fromSolanaResourcesRaw(resourcesRaw: SolanaResourcesRaw): SolanaResources {
  return {
    stakes: JSON.parse(resourcesRaw.stakes),
    unstakeReserve: new BigNumber(resourcesRaw.unstakeReserve),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const solanaAccount = account as SolanaAccount;
  if (solanaAccount.solanaResources) {
    (accountRaw as SolanaAccountRaw).solanaResources = toSolanaResourcesRaw(
      solanaAccount.solanaResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const solanaResourcesRaw = (accountRaw as SolanaAccountRaw).solanaResources;
  if (solanaResourcesRaw)
    (account as SolanaAccount).solanaResources = fromSolanaResourcesRaw(solanaResourcesRaw);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  const extra: SolanaOperationExtra = {};
  if (!isExtraValid(extraRaw)) return extra;
  const solanaExtraRaw = extraRaw as SolanaOperationExtraRaw;

  if (solanaExtraRaw.memo) {
    extra.memo = solanaExtraRaw.memo;
  }

  if (solanaExtraRaw.stake) {
    extra.stake = {
      address: solanaExtraRaw.stake.address,
      amount: new BigNumber(solanaExtraRaw.stake.amount),
    };
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  const extraRaw: SolanaOperationExtraRaw = {};
  if (!isExtraValid(extra)) return extraRaw;
  const solanaExtra = extra as SolanaOperationExtra;

  if (solanaExtra.memo) {
    extraRaw.memo = solanaExtra.memo;
  }

  if (solanaExtra.stake) {
    extraRaw.stake = {
      address: solanaExtra.stake.address,
      amount: solanaExtra.stake.amount.toJSON(),
    };
  }

  return extraRaw;
}

function isExtraValid(extra: OperationExtra | OperationExtraRaw): boolean {
  return !!extra && typeof extra === "object";
}
