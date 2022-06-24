import React, { useCallback } from "react";
import { View } from "react-native";
import { FiltersMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";

import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";

export default function AccountHeaderRight() {
  const { navigate } = useNavigation();

  const handleOnPress = useCallback(() => {
    navigate(ScreenName.NoDeviceWallScreen);
  }, [navigate]);

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
