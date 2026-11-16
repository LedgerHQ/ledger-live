import { useIsFocused } from "@react-navigation/native";
import {
  useShownStakePosition,
  type ShownStakePositionRequest,
} from "@features/flow-stake-position";

export type StakePositionSheetRootViewModel = Readonly<{
  request: ShownStakePositionRequest | null;
  isOpen: boolean;
}>;

export function useStakePositionSheetRootViewModel(): StakePositionSheetRootViewModel {
  const { request, phase } = useShownStakePosition("earn");
  // Earn can be mounted twice, as a tab and as a Base screen for its intents: only the focused
  // one shows the request, so its sync and its tracking run once.
  const isFocused = useIsFocused();

  return { request: isFocused ? request : null, isOpen: phase === "open" };
}
