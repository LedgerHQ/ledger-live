import { type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScreenName } from "~/const";

type EditTransactionSummaryNavigation<TTransaction, TStatus, TRouteParams extends object> = Pick<
  NavigationProp<ParamListBase>,
  "navigate"
> & {
  navigate: (
    screen: string,
    params: TRouteParams & {
      transaction: TTransaction;
      status: TStatus;
      selectDeviceLink: boolean;
    },
  ) => void;
};

type Params<TTransaction, TStatus, TRouteParams extends object> = {
  navigation: EditTransactionSummaryNavigation<TTransaction, TStatus, TRouteParams>;
  nextNavigation?: string;
  routeParams: TRouteParams;
  transaction: TTransaction;
  status: TStatus;
  feeTooHigh?: Error;
};

export default function useEditTransactionSummaryActions<
  TTransaction,
  TStatus,
  TRouteParams extends object,
>({
  navigation,
  nextNavigation,
  routeParams,
  transaction,
  status,
  feeTooHigh,
}: Params<TTransaction, TStatus, TRouteParams>) {
  const [highFeesOpen, setHighFeesOpen] = useState(false);

  const navigateToNext = useCallback(() => {
    const nextScreen = nextNavigation ?? ScreenName.SendSelectDevice;

    // This summary screen can be mounted in many navigator trees.
    // The caller chooses the next screen via nextNavigation.
    return navigation.navigate(nextScreen, {
      ...routeParams,
      transaction,
      status,
      selectDeviceLink: true,
    });
  }, [navigation, nextNavigation, routeParams, transaction, status]);

  const onAcceptFees = useCallback(() => {
    setHighFeesOpen(false);
    navigateToNext();
  }, [navigateToNext]);

  const onRejectFees = useCallback(() => {
    setHighFeesOpen(false);
  }, []);

  const onContinue = useCallback(() => {
    if (feeTooHigh) {
      setHighFeesOpen(true);
      return;
    }
    navigateToNext();
  }, [feeTooHigh, navigateToNext]);

  return {
    highFeesOpen,
    navigateToNext,
    onAcceptFees,
    onRejectFees,
    onContinue,
  };
}
