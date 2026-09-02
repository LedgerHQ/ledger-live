import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import { openSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";

export type PerpsTransactionSignedParams = Readonly<{
  /** Ticker of the currency credited to the perps balance, e.g. "USDC". */
  receiveCurrencyTicker: string;
  /** Only set when the provider issued one, so the deposit can be tracked. */
  swapId?: string;
  /** Provider that quoted the deposit, which titles the status drawer. */
  provider?: string;
}>;

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsTransactionSigned>
>;

export type PerpsTransactionSignedViewModel = Readonly<{
  receiveCurrencyTicker: string;
  handleViewTransaction: (() => void) | undefined;
  handleClose: () => void;
}>;

export function usePerpsTransactionSignedViewModel({
  navigation,
  route,
}: NavigationProps): PerpsTransactionSignedViewModel {
  const { receiveCurrencyTicker, swapId, provider } = route.params;
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleViewTransaction = useCallback(() => {
    if (!swapId) return;
    navigation.goBack();
    dispatch(openSwapTransactionStatusDrawer({ swapId, provider }));
  }, [dispatch, navigation, provider, swapId]);

  return {
    receiveCurrencyTicker,
    handleViewTransaction: swapId ? handleViewTransaction : undefined,
    handleClose,
  };
}
