import { useContext, useEffect } from "react";
import { NavigationContainerRefContext } from "@react-navigation/native";
import {
  dismissStakePosition,
  useShownStakePosition,
  type ShownStakePosition,
} from "@features/flow-stake-position";

export type StakePositionSheetRootViewModel = ShownStakePosition;

/**
 * The sheets live above the navigation, so another screen never hides them: the request is
 * dismissed when the focused screen changes, for instance when the device step opens My Ledger.
 */
function useDismissOnNavigation(requestId: number | undefined) {
  const navigation = useContext(NavigationContainerRefContext);

  useEffect(() => {
    if (requestId === undefined || !navigation) return;
    const openedOnRouteKey = navigation.getCurrentRoute()?.key;
    return navigation.addListener("state", () => {
      if (navigation.getCurrentRoute()?.key !== openedOnRouteKey) dismissStakePosition(requestId);
    });
  }, [navigation, requestId]);
}

/** Every request, whatever opened it: the one sheet of the app shows it. */
export function useStakePositionSheetRootViewModel(): StakePositionSheetRootViewModel {
  const shown = useShownStakePosition();
  const { request, phase } = shown;
  useDismissOnNavigation(request && phase !== "closed" ? request.id : undefined);

  return shown;
}
