import {
  useSyncOnUnbondingComplete,
  type AleoStakingPosition,
} from "@ledgerhq/live-common/families/aleo/react";
import {
  getUnbondingDisplayState,
  type AleoUnbondingDisplayState,
} from "@ledgerhq/live-common/families/aleo/stakingDisplay";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoLiveBlockHeight } from "../hooks/useAleoLiveBlockHeight";

export function useUnbondingState(
  account: AleoAccount,
  position: AleoStakingPosition,
): AleoUnbondingDisplayState {
  // The poll must be enabled before its height exists, so the countdown flag is read from the
  // synced height first and the full state is derived once the live height is in.
  const { isCountingDown } = getUnbondingDisplayState({
    position,
    syncedHeight: account.blockHeight,
    currentHeight: account.blockHeight,
  });
  const currentHeight = useAleoLiveBlockHeight(account.currency, {
    fallbackHeight: account.blockHeight,
    enabled: isCountingDown,
  });
  const state = getUnbondingDisplayState({
    position,
    syncedHeight: account.blockHeight,
    currentHeight,
  });
  useSyncOnUnbondingComplete(account.id, state.isSettling);

  return state;
}
