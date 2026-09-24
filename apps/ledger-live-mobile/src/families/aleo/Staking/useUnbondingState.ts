import { useIsFocused } from "@react-navigation/native";
import {
  useAleoUnbondingState,
  type AleoStakingPositionView,
} from "@ledgerhq/live-common/families/aleo/react";
import type {
  AleoAccount,
  AleoUnbondingDisplayState,
} from "@ledgerhq/live-common/families/aleo/types";
import useIsAppInBackground from "~/components/useIsAppInBackground";

/** The account screen stays mounted behind pushed screens, so focus — not mounting — gates the poll. */
export function useUnbondingState(
  account: AleoAccount,
  position: AleoStakingPositionView,
): AleoUnbondingDisplayState {
  const isInBackground = useIsAppInBackground();
  const isFocused = useIsFocused();

  return useAleoUnbondingState(account, position, { paused: isInBackground || !isFocused });
}
