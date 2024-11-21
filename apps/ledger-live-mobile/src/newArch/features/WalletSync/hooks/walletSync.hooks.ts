import { resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useDispatch } from "react-redux";
import {
  TrustchainEjected,
  TrustchainNotAllowed,
  TrustchainOutdated,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { ErrorType } from "./type.hooks";
import { StackActions, useNavigation } from "@react-navigation/native";
import { AnalyticsEvents } from "~/newArch/features/Analytics/enums";
import { track } from "~/analytics";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useRestoreTrustchain } from "./useRestoreTrustchain";
import { NavigatorName, ScreenName } from "~/const";

export const useLifeCycle = () => {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const { refetch: restoreTrustchain } = useRestoreTrustchain();
  const navigation = useNavigation();

  function reset() {
    dispatch(resetTrustchainStore());
    track(AnalyticsEvents.LedgerSyncDeactivated);
    const routeName = NavigatorName.WalletSync;
    const screen = ScreenName.WalletSyncActivationInit;
    navigation.dispatch(StackActions.replace(routeName, { screen }));
    sdk.invalidateJwt();
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
    [ErrorType.NULL]: () => reset(),
  };

  function handleError(error: Error) {
    if (error instanceof TrustchainEjected) reset();
    if (error instanceof TrustchainNotAllowed) reset();

    if (error instanceof TrustchainOutdated) restoreTrustchain();

    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};
