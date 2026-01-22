import React, { useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { track } from "~/analytics";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import { NavigatorName } from "~/const";
import { FlowStackNavigator } from "../FlowWizard/FlowStackNavigator";
import { SEND_FLOW_CONFIG } from "./constants";
import { stepRegistry } from "./index";
import type { SendFlowStep, SendStepConfig } from "./types";

type NavigationProps = BaseComposite<
  StackNavigatorProps<AddAccountsNavigatorParamList, NavigatorName.AddAccounts>
>;

export default function Navigator() {
  const route = useRoute<NavigationProps["route"]>();
  const navigation = useNavigation<StackNavigatorNavigation<AddAccountsNavigatorParamList>>();

  const exitProcess = useCallback(() => {
    const rootParent = navigation.getParent();
    if (rootParent) {
      // Navigate to the first route instead of replace to ensure proper screen lifecycle
      rootParent.navigate(rootParent.getState().routeNames[0]);
    }
  }, [navigation]);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    exitProcess();
  }, [route, exitProcess]);

  const onPressBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: route.name,
    });
    navigation.goBack();
  }, [route, navigation]);

  // Custom screen name generator based on step config
  const getScreenName = useCallback((step: SendFlowStep): string => {
    const stepConfig = SEND_FLOW_CONFIG.stepConfigs[step];
    return stepConfig.screenName || `NewSend${step}`;
  }, []);

  // Custom screen options generator with back button logic
  const getScreenOptions = useCallback(
    (step: SendFlowStep, config: SendStepConfig) => {
      const options = { ...config.screenOptions };

      // Handle back button visibility based on canGoBack
      if (config.canGoBack && !options.headerLeft) {
        options.headerLeft = () => <NavigationHeaderBackButton onPress={onPressBack} />;
      }

      // Ensure gesture navigation is enabled on iOS when back is allowed
      if (Platform.OS === "ios") {
        options.gestureEnabled = config.canGoBack;
      }

      return options;
    },
    [onPressBack],
  );

  // Custom initial params generator
  const getInitialParams = useCallback(
    (step: SendFlowStep, config: SendStepConfig) => {
      return {
        onCloseNavigation: onClose,
        // Add any step-specific initial params here
        ...(config.initialParams || {}),
      };
    },
    [onClose],
  );

  return (
    <FlowStackNavigator<SendFlowStep, SendStepConfig>
      stepRegistry={stepRegistry}
      flowConfig={SEND_FLOW_CONFIG}
      getScreenName={getScreenName}
      getScreenOptions={getScreenOptions}
      getInitialParams={getInitialParams}
      onClose={onClose}
      screenOptions={{
        gestureEnabled: Platform.OS === "ios",
      }}
    />
  );
}
