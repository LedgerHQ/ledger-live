import { track } from "@shared/analytics";
import { classifyKeyRingError, resetKeyRingState } from "@features/platform-key-ring";
import { useDispatch } from "~/context/hooks";
import { ErrorType } from "./type.hooks";
import { StackActions, useNavigation } from "@react-navigation/native";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { useKeyRingClient } from "./useKeyRingClient";
import { useRestoreTrustchain } from "./useRestoreTrustchain";
import { NavigatorName, ScreenName } from "~/const";

export const useLifeCycle = () => {
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const { refetch: restoreTrustchain } = useRestoreTrustchain();
  const navigation = useNavigation();

  function reset() {
    dispatch(resetKeyRingState());
    track(AnalyticsEvents.LedgerSyncDeactivated);
    const routeName = NavigatorName.WalletSync;
    const screen = ScreenName.WalletSyncActivationInit;
    navigation.dispatch(StackActions.replace(routeName, { screen }));
    client.invalidateAuth();
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
    [ErrorType.NULL]: () => reset(),
  };

  function handleError(error: Error) {
    const category = classifyKeyRingError(error);
    if (category === "member-removed") reset();
    if (category === "not-allowed") reset();

    if (category === "outdated") restoreTrustchain();

    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};
