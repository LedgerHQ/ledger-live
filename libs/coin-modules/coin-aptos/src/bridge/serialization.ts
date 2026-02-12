import { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAccount, AptosAccountRaw, AptosResources, AptosResourcesRaw } from "../types";

export function toAptosResourcesRaw(r: AptosResources): AptosResourcesRaw {
  const { activeBalance, pendingInactiveBalance, inactiveBalance, stakingPositions } = r;
  return {
    activeBalance: activeBalance.toString(),
    pendingInactiveBalance: pendingInactiveBalance.toString(),
    inactiveBalance: inactiveBalance.toString(),
    stakingPositions: stakingPositions.map(
      ({ active, validatorId, inactive, pendingInactive }) => ({
        active: active.toString(),
        pendingInactive: pendingInactive.toString(),
        inactive: inactive.toString(),
        validatorId,
      }),
    ),
  };
}

export function fromAptosResourcesRaw(r: AptosResourcesRaw): AptosResources {
  const { activeBalance, pendingInactiveBalance, inactiveBalance, stakingPositions = [] } = r;
  return {
    activeBalance: new BigNumber(activeBalance),
    pendingInactiveBalance: new BigNumber(pendingInactiveBalance),
    inactiveBalance: new BigNumber(inactiveBalance),
    stakingPositions: stakingPositions.map(
      ({ active, pendingInactive, inactive, validatorId }) => ({
        active: new BigNumber(active),
        pendingInactive: new BigNumber(pendingInactive),
        inactive: new BigNumber(inactive),
        validatorId,
      }),
    ),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const aptosAccount = account as AptosAccount;
  if (aptosAccount.aptosResources) {
    (accountRaw as AptosAccountRaw).aptosResources = toAptosResourcesRaw(
      aptosAccount.aptosResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const aptosResourcesRaw = (accountRaw as AptosAccountRaw).aptosResources;
  if (aptosResourcesRaw)
    (account as AptosAccount).aptosResources = fromAptosResourcesRaw(aptosResourcesRaw);
}
