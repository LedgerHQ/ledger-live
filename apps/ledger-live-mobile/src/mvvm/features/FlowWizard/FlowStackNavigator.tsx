import React, { useMemo, useCallback, useRef } from "react";
import { Platform } from "react-native";
import {
  createNativeStackNavigator,
  type NativeStackHeaderRightProps,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import { track } from "~/analytics";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";

import type { FlowStep } from "@ledgerhq/live-common/flows/wizard/types";
import type {
  FlowStackNavigatorProps,
  ReactNativeFlowScreenPresentation,
  ReactNativeFlowStepConfig,
} from "./types";

type NavigationProps = BaseComposite<
  StackNavigatorProps<AddAccountsNavigatorParamList, NavigatorName.AddAccounts>
>;

const Stack = createNativeStackNavigator();

const transparentModalScreenOptions: NativeStackNavigationOptions = {
  presentation: "transparentModal",
  animation: "none",
  headerShown: false,
  gestureEnabled: false,
  contentStyle: {
    backgroundColor: "transparent",
  },
};

export function getFlowStackScreenOptions({
  defaultOptions,
  customOptions,
  screenPresentation,
}: Readonly<{
  defaultOptions: NativeStackNavigationOptions;
  customOptions?: NativeStackNavigationOptions;
  screenPresentation?: ReactNativeFlowScreenPresentation;
}>): NativeStackNavigationOptions {
  return {
    ...defaultOptions,
    ...customOptions,
    ...(screenPresentation === "transparentModal" ? transparentModalScreenOptions : {}),
  };
}

function FlowHeaderRightClose(props: Readonly<{ onClose: () => void }>) {
  return <CloseWithConfirmation onClose={props.onClose} />;
}

function createHeaderRightClose(
  onClose: () => void,
): (props: NativeStackHeaderRightProps) => React.ReactNode {
  return (_navProps: NativeStackHeaderRightProps): React.ReactNode => (
    <FlowHeaderRightClose onClose={onClose} />
  );
}

/**
 * FlowStackNavigator - Generic Stack Navigator for MVVM Flows
 *
 * Maps over stepRegistry to automatically generate Stack.Screen components
 * with proper navigation, options, and params based on flow configuration.
 *
 * Adapts the FlowWizard pattern from desktop to React Native navigation.
 */
export function FlowStackNavigator<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends ReactNativeFlowStepConfig<TStep> = ReactNativeFlowStepConfig<TStep>,
>({
  stepRegistry,
  flowConfig,
  screenOptions: baseScreenOptions,
  disableBackGesture = false,
  getScreenName,
  getScreenOptions,
  getInitialParams,
  onClose,
}: FlowStackNavigatorProps<TStep, TStepConfig>) {
  const { theme } = useLumenTheme();
  const route = useRoute<NavigationProps["route"]>();
  const navigation = useNavigation<StackNavigatorNavigation<AddAccountsNavigatorParamList>>();

  const routeRef = useRef(route);
  routeRef.current = route;

  // Default exit process
  const exitProcess = useCallback(() => {
    const rootParent = navigation.getParent();
    if (rootParent) {
      rootParent.navigate(rootParent.getState().routeNames[0]);
    }
  }, [navigation]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: routeRef.current.name,
    });
    if (onClose) {
      onClose();
    } else {
      exitProcess();
    }
  }, [exitProcess, onClose]);

  const defaultStackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigationConfigV4(theme),
      headerRight: createHeaderRightClose(handleClose),
      headerShown: false,
    }),
    [theme, handleClose],
  );

  const handleBackPress = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: routeRef.current.name,
    });
    navigation.goBack();
  }, [navigation]);

  // Generate screen configurations from stepRegistry and flowConfig
  const screenConfigs = useMemo(() => {
    const { stepOrder, stepConfigs } = flowConfig;

    return stepOrder
      .map((step, index) => {
        const stepConfig = stepConfigs[step];
        const component = stepRegistry[step];

        if (!component) {
          console.warn(`No component found in stepRegistry for step: ${step}`);
          return null;
        }

        // Generate screen name
        const screenName = getScreenName ? getScreenName(step) : `Flow${step}`;

        // Determine navigation options based on step config
        const canGoBack = stepConfig?.canGoBack && index > 0;
        const defaultOptions = {
          ...TransparentHeaderNavigationOptions,
          gestureEnabled: Platform.OS === "ios" && canGoBack && !disableBackGesture,
          headerLeft: canGoBack
            ? () => <NavigationHeaderBackButton onPress={handleBackPress} />
            : () => null,
        };

        // Apply custom screen options
        const customOptions = getScreenOptions ? getScreenOptions(step, stepConfig) : {};
        const stepScreenOptions = getFlowStackScreenOptions({
          defaultOptions,
          customOptions,
          screenPresentation: stepConfig?.screenPresentation,
        });

        // Generate initial params
        const defaultInitialParams = {
          onCloseNavigation: handleClose,
        };

        const customInitialParams = getInitialParams ? getInitialParams(step, stepConfig) : {};
        const initialParams = { ...defaultInitialParams, ...customInitialParams };

        return {
          step,
          name: screenName,
          component,
          options: stepScreenOptions,
          initialParams,
          listeners: stepConfig?.listeners,
        };
      })
      .filter((config): config is NonNullable<typeof config> => config !== null);
  }, [
    flowConfig,
    stepRegistry,
    getScreenName,
    getScreenOptions,
    getInitialParams,
    handleClose,
    handleBackPress,
    disableBackGesture,
  ]);

  // Merge base screen options with default config
  const mergedScreenOptions = useMemo(() => {
    return {
      ...defaultStackNavigationConfig,
      ...baseScreenOptions,
    };
  }, [defaultStackNavigationConfig, baseScreenOptions]);

  return (
    <Stack.Navigator screenOptions={mergedScreenOptions}>
      {screenConfigs.map(config => (
        <Stack.Screen
          key={config.step}
          name={config.name}
          component={config.component}
          options={config.options}
          initialParams={config.initialParams}
          listeners={config.listeners}
        />
      ))}
    </Stack.Navigator>
  );
}
