import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";

export function useIsSwapTab() {
  const navigation = useNavigation();
  const currentNavigationIndex = navigation.getState()?.index;

  const currentScreen = Number.isInteger(currentNavigationIndex)
    ? navigation.getState()?.routes[currentNavigationIndex!]
    : null;

  const isSwapTabScreen = currentScreen?.name === ScreenName.SwapTab;

  const swapTabScreen = isSwapTabScreen ? currentScreen : null;

  return { isSwapTabScreen, swapTabScreen };
}
