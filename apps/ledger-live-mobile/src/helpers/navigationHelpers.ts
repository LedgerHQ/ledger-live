import { NavigatorName, ScreenName } from "~/const";

const screenToNavigatorMap = {
  [ScreenName.SendSummary]: NavigatorName.SendFunds,
  [ScreenName.SignTransactionSummary]: NavigatorName.SignTransaction,
  [ScreenName.SwapForm]: NavigatorName.Swap,
} as const;

type ScreenToNavigatorMap = typeof screenToNavigatorMap;
type MappedScreen = keyof ScreenToNavigatorMap;

export const popToScreen = <T extends MappedScreen>(
  navigation: { popTo: (navigator: ScreenToNavigatorMap[T], params: unknown) => void },
  screen: T,
  params: unknown,
): void => {
  const navigator = screenToNavigatorMap[screen];

  navigation.popTo(navigator, {
    screen,
    params,
  });
};
