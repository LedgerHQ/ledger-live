import { SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import compact from "lodash/compact";
import { ChainAPI } from "..";
import { isHistoryEntry } from "../../../utils";
import { tryParseAsStakeAccount } from "../account";
import { ParsedOnChainStakeAccountWithInfo, toStakeAccountWithInfo } from "../web3";
import { getStakeActivatingAndDeactivating, StakeActivatingAndDeactivating } from "./delegation";

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

interface StakeAccount {
  account: ParsedOnChainStakeAccountWithInfo;
  activation: StakeActivationData;
  reward: null;
}

function toStakeAccount(
  rawStakeAccount: ParsedOnChainStakeAccountWithInfo,
  epoch: BigNumber,
  stakeHistory: Array<{
    epoch: BigNumber;
    effective: BigNumber;
    activating: BigNumber;
    deactivating: BigNumber;
  }>,
): StakeAccount | undefined {
  const data = rawStakeAccount.onChainAcc.account.data;
  if (!("parsed" in data)) return undefined;

  const parsedStakeAccount = tryParseAsStakeAccount(data);
  if (parsedStakeAccount instanceof Error) return undefined;

  const { effective, activating, deactivating } = parsedStakeAccount?.stake
    ? getStakeActivatingAndDeactivating(
        parsedStakeAccount.stake.delegation,
        BigNumber(epoch),
        stakeHistory,
      )
    : {
        effective: BigNumber(0),
        activating: BigNumber(0),
        deactivating: BigNumber(0),
      };

  const inactive = BigNumber(rawStakeAccount.onChainAcc.account.lamports)
    .minus(effective)
    .minus(parsedStakeAccount?.meta.rentExemptReserve || 0);

  return {
    account: rawStakeAccount,
    activation: {
      state: getStakeActivationState({ effective, activating, deactivating }),
      active: effective.toNumber(),
      inactive: inactive.toNumber(),
    } as StakeActivationData,
    reward: null,
  };
}

export async function getStakeAccounts(
  api: ChainAPI,
  mainAccountAddress: string,
): Promise<Array<StakeAccount>> {
  const rawStakeAccounts = await api.getStakeAccountsByWithdrawAuth(mainAccountAddress);

  if (!rawStakeAccounts.length) return [];

  const sysvarStakeHistoryAccount = await api.getAccountInfo(
    SYSVAR_STAKE_HISTORY_PUBKEY.toBase58(),
  );
  if (
    !sysvarStakeHistoryAccount ||
    !("parsed" in sysvarStakeHistoryAccount.data) ||
    !("info" in sysvarStakeHistoryAccount.data.parsed)
  )
    throw new Error("StakeHistory not found");

  const sysvarStakeHistoryAccountInfo = sysvarStakeHistoryAccount.data.parsed.info;
  const stakeHistory = Array.isArray(sysvarStakeHistoryAccountInfo)
    ? sysvarStakeHistoryAccountInfo.filter(isHistoryEntry).map(e => ({
        epoch: BigNumber(e.epoch),
        effective: BigNumber(e.stakeHistory.effective),
        activating: BigNumber(e.stakeHistory.activating),
        deactivating: BigNumber(e.stakeHistory.deactivating),
      }))
    : [];

  const { epoch } = await api.getEpochInfo();
  const stakes = rawStakeAccounts.map(rawStakeAccount => {
    const stakeAccountWithInfo = toStakeAccountWithInfo(rawStakeAccount);

    return (
      stakeAccountWithInfo && toStakeAccount(stakeAccountWithInfo, BigNumber(epoch), stakeHistory)
    );
  });

  return compact(stakes);
}
