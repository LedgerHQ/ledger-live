import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import { Flex } from "@ledgerhq/native-ui";
import HelpButton from "~/screens/ReceiveFunds/HelpButton";
import { useSelector } from "react-redux";
import { hasClosedNetworkBannerSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import SelectCrypto from "LLM/features/AssetSelection/screens/SelectCrypto";
import SelectNetwork from "LLM/features/AssetSelection/screens/SelectNetwork";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { AssetSelectionNavigatorParamsList } from "./types";

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute();

  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
    }),
    [colors, onClose],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AddAccountsSelectCrypto}
        component={SelectCrypto}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
        }}
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
              <NavigationHeaderCloseButtonAdvanced onClose={onClose} />
            </Flex>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AssetSelectionNavigatorParamsList>();
