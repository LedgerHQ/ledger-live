import { Connection, PublicKey, SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { getStakeActivatingAndDeactivating, StakeActivatingAndDeactivating } from "./delegation";
import { parseStakeHistoryEntry, tryParseAsStakeAccount } from "../account";

function getStakeActivationState({
  activating,
  deactivating,
  effective,
}: StakeActivatingAndDeactivating) {
  if (deactivating.gt(0)) {
    return "deactivating";
  } else if (activating.gt(0)) {
    return "activating";
  } else if (effective.gt(0)) {
    return "active";
  } else {
    return "inactive";
  }
}

type StakeActivationState = "active" | "inactive" | "activating" | "deactivating";

export interface StakeActivationData {
  state: StakeActivationState;
  active: number;
  inactive: number;
}

// Replacement for outdated connection.getStakeActivation rpc endpoint.
// Based on example from Solana team https://github.com/solana-developers/solana-rpc-get-stake-activation
// TODO: Install solana-rpc-get-stake-activation via npm package when it's published.
export async function getStakeActivation(
  connection: Connection,
  stakeAddress: PublicKey,
): Promise<StakeActivationData> {
  const [epochInfo, { stakeAccountOrErr, stakeAccountLamports }, stakeHistory] = await Promise.all([
    connection.getEpochInfo("confirmed"),

    (async () => {
      const stakeAccount = await connection.getParsedAccountInfo(stakeAddress, "confirmed");
      if (stakeAccount === null || stakeAccount.value === null) {
        throw new Error("Account not found");
      }
      const stakeAccountOrErr =
        "parsed" in stakeAccount.value.data
          ? tryParseAsStakeAccount(stakeAccount.value.data)
          : undefined;

      return { stakeAccountOrErr, stakeAccountLamports: stakeAccount.value.lamports };
    })(),

    (async () => {
      const stakeHistoryAccount = await connection.getParsedAccountInfo(
        SYSVAR_STAKE_HISTORY_PUBKEY,
        "confirmed",
      );
      if (stakeHistoryAccount.value === null || !("parsed" in stakeHistoryAccount.value.data)) {
        throw new Error("StakeHistory not found");
      }
      return stakeHistoryAccount.value.data.parsed.info.map((entry: any) => {
        return parseStakeHistoryEntry({ epoch: entry.epoch, ...entry.stakeHistory });
      });
    })(),
  ]);

  if (stakeAccountOrErr instanceof Error) throw stakeAccountOrErr;

  const { effective, activating, deactivating } = stakeAccountOrErr?.stake
    ? getStakeActivatingAndDeactivating(
        stakeAccountOrErr.stake.delegation,
        BigNumber(epochInfo.epoch),
        stakeHistory,
      )
    : {
        effective: BigNumber(0),
        activating: BigNumber(0),
        deactivating: BigNumber(0),
      };

  const state = getStakeActivationState({ effective, activating, deactivating });
  const inactive = BigNumber(stakeAccountLamports)
    .minus(effective)
    .minus(stakeAccountOrErr?.meta.rentExemptReserve || 0);

  return {
    state,
    active: effective.toNumber(),
    inactive: inactive.toNumber(),
  };
}
