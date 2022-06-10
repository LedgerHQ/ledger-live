import React, { useCallback } from "react";
import { View } from "react-native";
import { FiltersMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";

import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";
import { useCurrentRouteName } from "../../../helpers/routeHooks";
import { track } from "../../../analytics";
import useCurrency from "../../../helpers/useCurrency";

export default function AccountHeaderRight() {
  const { navigate } = useNavigation();
  const currentRoute = useCurrentRouteName();
  const currency = useCurrency().name;

  const handleOnPress = useCallback(() => {
    track("button_clicked", {
      button: "Account Settings",
      screen: currentRoute,
      currency,
    });
    navigate(ScreenName.NoDeviceWallScreen);
  }, [currentRoute, currency, navigate]);

  return (
    <Touchable
      onPress={handleOnPress}
      style={{ alignItems: "center", justifyContent: "center", margin: 16 }}
    >
      <View>
        <FiltersMedium size={24} color="neutral.c100" />
      </View>
    </Touchable>
  );
}
