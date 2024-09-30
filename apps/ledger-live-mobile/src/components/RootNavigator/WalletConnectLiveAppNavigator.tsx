import React, { useEffect, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useDispatch, useSelector } from "react-redux";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { LiveApp } from "~/screens/Platform";
import { uriSelector } from "~/reducers/walletconnect";
import { setWallectConnectUri } from "~/actions/walletconnect";
import { WalletConnectLiveAppNavigatorParamList } from "./types/WalletConnectLiveAppNavigator";
import { WC_ID } from "@ledgerhq/live-common/wallet-api/constants";

const options = {
  headerBackImage: () => (
    <Flex pl="16px">
      <IconsLegacy.CloseMedium color="neutral.c100" size="20px" />
    </Flex>
  ),
  headerStyle: styles.headerNoShadow,
  headerTitle: () => null,
};

export default function WalletConnectLiveAppNavigator() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const uri = useSelector(uriSelector);

  useEffect(() => {
    return () => {
      dispatch(setWallectConnectUri());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen name={ScreenName.WalletConnectConnect} options={options}>
        {_props => {
          return (
            <LiveApp
              {..._props}
              route={{
                key: _props.route.key,
                name: ScreenName.PlatformApp,
                params: {
                  platform: WC_ID,
                  uri: uri || _props.route.params?.uri,
                  requestId: _props.route.params?.requestId,
                  sessionTopic: _props.route.params?.sessionTopic,
                },
              }}
            />
          );
        }}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<WalletConnectLiveAppNavigatorParamList>();
