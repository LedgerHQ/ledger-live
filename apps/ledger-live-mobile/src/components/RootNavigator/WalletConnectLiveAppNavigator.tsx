import React, { useEffect, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useDispatch, useSelector } from "react-redux";
<<<<<<< HEAD
=======

import useFeature from "@ledgerhq/live-config/FeatureFlags/useFeature";
>>>>>>> f8e0133b13 (fix: refactoring)
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";

import { LiveApp } from "../../screens/Platform";
import { uriSelector } from "../../reducers/walletconnect";
import { setWallectConnectUri } from "../../actions/walletconnect";
import { WalletConnectLiveAppNavigatorParamList } from "./types/WalletConnectLiveAppNavigator";
import { StackNavigatorProps } from "./types/helpers";

const PLATFORM = "ledger-wallet-connect";

const options = {
  headerBackImage: () => (
    <Flex pl="16px">
      <IconsLegacy.CloseMedium color="neutral.c100" size="20px" />
    </Flex>
  ),
  headerStyle: styles.headerNoShadow,
  headerTitle: () => null,
};

type Navigation = StackNavigatorProps<WalletConnectLiveAppNavigatorParamList>;

export default function WalletConnectLiveAppNavigator() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const route = useRoute<Navigation["route"]>();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const uri = useSelector(uriSelector);

  useEffect(() => {
    return () => {
      dispatch(setWallectConnectUri());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { params: routeParams } = route;

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen name={ScreenName.WalletConnectConnect} options={options}>
        {_props => (
          <LiveApp
            {..._props}
            // @ts-expect-error What are you expecting when spreading 3 times in a row?
            {...routeParams}
            route={{
              ..._props.route,
              params: {
                platform: PLATFORM,
                uri: uri || _props.route.params?.uri,
              },
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<WalletConnectLiveAppNavigatorParamList>();
