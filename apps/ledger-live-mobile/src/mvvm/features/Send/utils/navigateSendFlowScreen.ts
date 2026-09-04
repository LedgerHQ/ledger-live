import { ScreenName } from "~/const";

export type SendFlowStepScreen =
  | typeof ScreenName.SendFlowRecipient
  | typeof ScreenName.SendFlowAmount;

type SendFlowStackNavigation = {
  getState: () => { routes: ReadonlyArray<{ name: string }>; index: number };
  goBack: () => void;
  navigate: (name: SendFlowStepScreen) => void;
};

export function navigateSendFlowScreen(
  navigation: SendFlowStackNavigation,
  screen: SendFlowStepScreen,
): void {
  const { routes, index } = navigation.getState();
  if (routes[index - 1]?.name === screen) {
    navigation.goBack();
    return;
  }
  navigation.navigate(screen);
}
