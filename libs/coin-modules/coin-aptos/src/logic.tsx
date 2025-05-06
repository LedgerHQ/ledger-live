import { AptosStake, StakeAction } from "./types";

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export const MAX_MEMO_LENGTH = 500;

export function encodeAccountIdWithTokenAccountAddress(accountId: string, address: string): string {
  return `${accountId}+${address}`;
}

export function decodeAccountIdWithTokenAccountAddress(accountIdWithTokenAccountAddress: string): {
  accountId: string;
  address: string;
} {
  const lastColonIndex = accountIdWithTokenAccountAddress.lastIndexOf("+");
  return {
    accountId: accountIdWithTokenAccountAddress.slice(0, lastColonIndex),
    address: accountIdWithTokenAccountAddress.slice(lastColonIndex + 1),
  };
}

export function stakeActions(stake: AptosStake): StakeAction[] {
  const actions: StakeAction[] = [];

  if (stake.withdrawable > 0) {
    actions.push("withdraw");
  }

  switch (stake.activation.state) {
    case "active":
    case "activating":
      actions.push("deactivate");
      break;
    case "deactivating":
      actions.push("reactivate");
      break;
    case "inactive":
      actions.push("activate");
      break;
    default:
      actions.push("activate");
      break;
  }
  return actions;
}

export function withdrawableFromStake({
  stakeAccBalance,
  activation,
  rentExemptReserve,
}: {
  stakeAccBalance: number;
  activation: AptosStake["activation"];
  rentExemptReserve: number;
}) {
  switch (activation.state) {
    case "active":
    case "activating":
      return stakeAccBalance - rentExemptReserve - activation.active - activation.inactive;
    case "deactivating":
      return stakeAccBalance - rentExemptReserve - activation.active;
    case "inactive":
      return stakeAccBalance;
    default:
      return rentExemptReserve - activation.active;
  }
}

export function stakeActivePercent(stake: AptosStake) {
  const amount = stake.delegation?.stake;
  if (amount === undefined || amount === 0) {
    return 0;
  }
  return (stake.activation.active / amount) * 100;
}
