import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { fromRawBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import {
  type PolkadotResourcesRaw,
  type PolkadotResources,
  type PolkadotAccount,
  type PolkadotAccountRaw,
  type PolkadotOperationExtra,
  type PolkadotOperationExtraRaw,
  isPolkadotOperationExtraRaw,
  isPolkadotOperationExtra,
  PalletMethod,
} from "../types";

function toPolkadotResourcesRaw(r: PolkadotResources): PolkadotResourcesRaw {
  const { nonce, controller, stash } = r;
  return {
    controller,
    stash,
    nonce,
    lockedBalance: r.lockedBalance.toString(),
    unlockedBalance: r.unlockedBalance.toString(),
    unlockingBalance: r.unlockingBalance.toString(),
    unlockings: r.unlockings?.map(u => ({
      amount: u.amount.toString(),
      completionDate: u.completionDate.toISOString(),
    })),
    nominations: r.nominations?.map(n => ({
      address: n.address,
      value: n.value.toString(),
      status: n.status,
      isRegistered: n.isRegistered,
    })),
    numSlashingSpans: r.numSlashingSpans,
  };
}
function fromPolkadotResourcesRaw(r: PolkadotResourcesRaw): PolkadotResources {
  const { nonce, controller, stash } = r;
  return {
    controller,
    stash,
    nonce,
    lockedBalance: fromRawBigNumber(r.lockedBalance),
    unlockedBalance: fromRawBigNumber(r.unlockedBalance),
    unlockingBalance: fromRawBigNumber(r.unlockingBalance),
    unlockings: r.unlockings?.map(u => ({
      amount: fromRawBigNumber(u.amount),
      completionDate: new Date(u.completionDate),
    })),
    nominations: r.nominations?.map(n => ({
      address: n.address,
      value: fromRawBigNumber(n.value),
      status: n.status,
      isRegistered: n.isRegistered,
    })),
    numSlashingSpans: Number(r.numSlashingSpans) || 0,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const polkadotAccount = account as PolkadotAccount;
  if (polkadotAccount.polkadotResources) {
    (accountRaw as PolkadotAccountRaw).polkadotResources = toPolkadotResourcesRaw(
      polkadotAccount.polkadotResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const polkadotResourcesRaw = (accountRaw as PolkadotAccountRaw).polkadotResources;
  if (polkadotResourcesRaw)
    (account as PolkadotAccount).polkadotResources = fromPolkadotResourcesRaw(polkadotResourcesRaw);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  if (!isPolkadotOperationExtraRaw(extraRaw)) {
    throw Error("Unsupported OperationExtraRaw");
  }

  const extra: PolkadotOperationExtra = {
    palletMethod: extraRaw.palletMethod as PalletMethod,
    validatorStash: extraRaw.validatorStash,
    validators: extraRaw.validators,
  };

  if (extraRaw.transferAmount) {
    extra.transferAmount = fromRawBigNumber(extraRaw.transferAmount);
  }

  if (extraRaw.bondedAmount) {
    extra.bondedAmount = fromRawBigNumber(extraRaw.bondedAmount);
  }

  if (extraRaw.unbondedAmount) {
    extra.unbondedAmount = fromRawBigNumber(extraRaw.unbondedAmount);
  }

  if (extraRaw.withdrawUnbondedAmount) {
    extra.withdrawUnbondedAmount = fromRawBigNumber(extraRaw.withdrawUnbondedAmount);
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  if (!isPolkadotOperationExtra(extra)) {
    throw Error("Unsupported OperationExtra");
  }

  const extraRaw: PolkadotOperationExtraRaw = {
    palletMethod: extra.palletMethod,
    validatorStash: extra.validatorStash,
    validators: extra.validators,
  };

  if (extra.transferAmount) {
    extraRaw.transferAmount = extra.transferAmount.toString();
  }

  if (extra.bondedAmount) {
    extraRaw.bondedAmount = extra.bondedAmount.toString();
  }

  if (extra.unbondedAmount) {
    extraRaw.unbondedAmount = extra.unbondedAmount.toString();
  }

  if (extra.withdrawUnbondedAmount) {
    extraRaw.withdrawUnbondedAmount = extra.withdrawUnbondedAmount.toString();
  }

  return extraRaw;
}
