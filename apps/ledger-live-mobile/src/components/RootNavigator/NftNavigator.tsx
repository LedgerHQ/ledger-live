import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import NftViewer from "../Nft/NftViewer";
import NftImageViewer from "../Nft/NftImageViewer";
import { ScreenName } from "~/const";
import type { NftNavigatorParamList } from "./types/NftNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import HiddenNftCollections from "~/screens/Settings/Accounts/HiddenNftCollections";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setGalleryFilterDrawerVisible } from "~/actions/nft";

const NftNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  return (
    <Stack.Navigator screenOptions={stackNavConfig} detachInactiveScreens>
      <Stack.Screen
        name={ScreenName.NftViewer}
        component={NftViewer}
        options={() => ({
          title: "",
          headerRight: undefined,
          headerTransparent: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        })}
      />
      <Stack.Screen
        name={ScreenName.NftImageViewer}
        component={NftImageViewer}
        options={() => ({
          title: "",
          headerRight: undefined,
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTransparent: true,
        })}
      />
      <Stack.Screen
        name={ScreenName.HiddenNftCollections}
        component={HiddenNftCollections}
        options={{
          headerLeft: () => (
            <NavigationHeaderBackButton
              onPress={() => {
                // NOTE: We reopen the filters drawer when navigating back from this route
                // because it should only be accessible via the Nft gallery page.
                // If at any point there is another way to navigate to this screen, then
                // this might not make sense to show.
                dispatch(setGalleryFilterDrawerVisible(true));
                navigation.goBack();
              }}
            />
          ),
          headerRight: undefined,
          title: t("wallet.nftGallery.filters.hiddenCollections"),
        }}
      />
    </Stack.Navigator>
  );
};

const Stack = createStackNavigator<NftNavigatorParamList>();

export default NftNavigator;
