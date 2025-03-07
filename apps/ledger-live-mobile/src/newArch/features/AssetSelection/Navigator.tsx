import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import { Flex } from "@ledgerhq/native-ui";
import HelpButton from "~/screens/ReceiveFunds/HelpButton";
import { useSelector } from "react-redux";
import { hasClosedNetworkBannerSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import SelectCrypto from "LLM/features/AssetSelection/screens/SelectCrypto";
import SelectNetwork from "LLM/features/AssetSelection/screens/SelectNetwork";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { AssetSelectionNavigatorParamsList } from "./types";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import useAnalytics from "../../hooks/useAnalytics";
import { ConsoleLogger } from "~/logger";

type NavigationProps = BaseComposite<
  StackNavigatorProps<AssetSelectionNavigatorParamsList, NavigatorName.AssetSelection>
>;

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute<NavigationProps["route"]>();
  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);

  const { token, currency, context, sourceScreenName } = route.params || {};

  console.warn(">>> AssetSelection > route.params", route.params);

  const navigation = useNavigation();
  const { analyticsMetadata } = useAnalytics(context, sourceScreenName);

  const handleOnCloseAssetSelectionNavigator = useCallback(
    (screenName: string) => () => {
      console.log(
        `>> onCloseAssetSelectionNavigator: ${screenName} - add onClose event if needed...`,
      );
      const closeMetadata = analyticsMetadata[screenName]?.onClose;
      if (closeMetadata)
        track(closeMetadata.eventName, {
          ...closeMetadata.payload,
        });
      navigation.getParent()?.goBack();
    },
    [navigation, analyticsMetadata],
  );

  const handleOnBack = useCallback(
    (screenName: string) => (nav: typeof navigation) => {
      const backMetadata = analyticsMetadata[screenName]?.onBack;
      if (backMetadata)
        track(backMetadata.eventName, {
          ...backMetadata.payload,
        });
      nav.goBack();
    },
    [analyticsMetadata],
  );

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
    }),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      initialRouteName={
        token || currency ? ScreenName.SelectNetwork : ScreenName.AddAccountsSelectCrypto
      }
    >
      <Stack.Screen
        name={ScreenName.AddAccountsSelectCrypto}
        component={SelectCrypto}
        options={{
          title: "",
          headerRight: () => (
            <CloseWithConfirmation
              onClose={handleOnCloseAssetSelectionNavigator(ScreenName.AddAccountsSelectCrypto)}
            />
          ),

          headerLeft: () => (
            <NavigationHeaderBackButton
              onPress={handleOnBack(ScreenName.AddAccountsSelectCrypto)}
            />
          ),
        }}
        initialParams={route.params}
      />

      <Stack.Screen
        name={ScreenName.SelectNetwork}
        component={SelectNetwork}
        options={{
          headerTitle: "",
          headerLeft: () => (
            <NavigationHeaderBackButton onPress={handleOnBack(ScreenName.SelectNetwork)} />
          ),
          headerRight: () => (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              {hasClosedNetworkBanner && (
                <HelpButton eventButton="Choose a network article" url={urls.chooseNetwork} />
              )}
              <CloseWithConfirmation
                onClose={handleOnCloseAssetSelectionNavigator(ScreenName.SelectNetwork)}
              />
            </Flex>
          ),
        }}
        initialParams={route.params}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AssetSelectionNavigatorParamsList>();
