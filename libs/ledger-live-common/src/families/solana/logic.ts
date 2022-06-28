import { findTokenById } from "@ledgerhq/cryptoassets";
import { PublicKey } from "@solana/web3.js";
import { TokenAccount } from "@ledgerhq/types-live";
import { StakeMeta } from "./api/chain/account/stake";
import { SolanaStake, StakeAction } from "./types";
import { assertUnreachable } from "./utils";

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export const MAX_MEMO_LENGTH = 500;

export const isValidBase58Address = (address: string): boolean => {
  try {
    return Boolean(new PublicKey(address));
  } catch (_) {
    return false;
  }
};

export const isEd25519Address = (address: string): boolean => {
  return PublicKey.isOnCurve(new PublicKey(address).toBytes());
};

export function encodeAccountIdWithTokenAccountAddress(
  accountId: string,
  address: string
): string {
  return `${accountId}+${address}`;
}

export function decodeAccountIdWithTokenAccountAddress(
  accountIdWithTokenAccountAddress: string
): { accountId: string; address: string } {
  const lastColonIndex = accountIdWithTokenAccountAddress.lastIndexOf("+");
  return {
    accountId: accountIdWithTokenAccountAddress.slice(0, lastColonIndex),
    address: accountIdWithTokenAccountAddress.slice(lastColonIndex + 1),
  };
}

export function toTokenId(mint: string): string {
  return `solana/spl/${mint}`;
}

export function toTokenMint(tokenId: string): string {
  return tokenId.split("/")[2];
}

export function toSubAccMint(subAcc: TokenAccount): string {
  return toTokenMint(subAcc.token.id);
}

export function tokenIsListedOnLedger(mint: string): boolean {
  return findTokenById(toTokenId(mint))?.type === "TokenCurrency";
}

export function stakeActions(stake: SolanaStake): StakeAction[] {
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
      return assertUnreachable(stake.activation.state);
  }

  return actions;
}

export function withdrawableFromStake({
  stakeAccBalance,
  activation,
  rentExemptReserve,
}: {
  stakeAccBalance: number;
  activation: SolanaStake["activation"];
  rentExemptReserve: number;
}) {
  switch (activation.state) {
    case "active":
    case "activating":
      return (
        stakeAccBalance -
        rentExemptReserve -
        activation.active -
        activation.inactive
      );
    case "deactivating":
      return stakeAccBalance - rentExemptReserve - activation.active;
    case "inactive":
      return stakeAccBalance;
    default:
      return assertUnreachable(activation.state);
  }
}

export function isStakeLockUpInForce({
  lockup,
  custodianAddress,
  epoch,
}: {
  lockup: StakeMeta["lockup"];
  custodianAddress: string;
  epoch: number;
}) {
  if (custodianAddress === lockup.custodian.toBase58()) {
    return false;
  }
  return lockup.unixTimestamp > Date.now() / 1000 || lockup.epoch > epoch;
}

export function stakeActivePercent(stake: SolanaStake) {
  const amount = stake.delegation?.stake;
  if (amount === undefined || amount === 0) {
    return 0;
  }
  return (stake.activation.active / amount) * 100;
}
