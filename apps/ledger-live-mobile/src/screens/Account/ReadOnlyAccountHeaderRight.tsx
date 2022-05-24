import React from "react";
import { View } from "react-native";
import { FiltersMedium } from "@ledgerhq/native-ui/assets/icons";

import Touchable from "../../components/Touchable";

export default function AccountHeaderRight() {
  return (
    <Touchable
      onPress={() => {}}
      style={{ alignItems: "center", justifyContent: "center", margin: 16 }}
    >
      <View>
        <FiltersMedium size={24} color="neutral.c100" />
      </View>
    </Touchable>
  );
}
