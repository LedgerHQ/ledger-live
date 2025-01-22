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

type NavigationProps = BaseComposite<
  StackNavigatorProps<AssetSelectionNavigatorParamsList, NavigatorName.AssetSelection>
>;

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute<NavigationProps["route"]>();
  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);

  const { token, currency } = route.params || {};
  const navigation = useNavigation();

  const handleOnCloseAssetSelectionNavigator = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    navigation.getParent()?.goBack();
  }, [route, navigation]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <CloseWithConfirmation onClose={handleOnCloseAssetSelectionNavigator} />,
    }),
    [colors, handleOnCloseAssetSelectionNavigator],
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
          headerLeft: () => <NavigationHeaderBackButton />,
          title: "",
        }}
        initialParams={route.params}
      />

      <Stack.Screen
        name={ScreenName.SelectNetwork}
        component={SelectNetwork}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              {hasClosedNetworkBanner && (
                <HelpButton eventButton="Choose a network article" url={urls.chooseNetwork} />
              )}
              {stackNavigationConfig.headerRight()}
            </Flex>
          ),
        }}
        initialParams={route.params}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AssetSelectionNavigatorParamsList>();
