import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import ReceiveFundsOptions from "~/screens/ReceiveFundsOptions";
import { useRoute } from "@react-navigation/core";
import { shouldShowNoahMenu, NoahRouteProp } from "~/logic/shouldShowNoahMenu";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Get options to spread in a Stack.Screen when you need the noah
 * menu to show if the experiment is enabled
 */
export const useReceiveNoahEntry = ():
  | {
      component: () => JSX.Element;
      options: NativeStackNavigationOptions;
    }
  | object => {
  const noah = useFeature("noah");
  const route = useRoute<NoahRouteProp>();
  const showMenu = shouldShowNoahMenu(route, noah?.enabled ?? false);

  // Show the original configuration in the stack
  if (!showMenu) {
    return {};
  }

  return {
    component: ReceiveFundsOptions,
    options: {
      headerShown: false,
      presentation: "transparentModal",
      gestureEnabled: true,
      headerTitle: () => null,
      headerRight: () => null,
      headerBackButtonDisplayMode: "minimal",
      title: "",
      contentStyle: {
        opacity: 0.5,
      },
    },
  };
};
