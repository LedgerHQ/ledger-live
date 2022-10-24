import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../components/RootNavigator/types/SettingsNavigator";

export default function OpenDebugHttpTransport() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  return (
    <SettingsRow
      title="Debug http transport"
      onPress={() => navigation.navigate(ScreenName.DebugHttpTransport)}
    />
  );
}
