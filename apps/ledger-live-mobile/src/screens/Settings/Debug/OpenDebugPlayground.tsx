import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugPlayground() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug playground"
      onPress={() => navigation.navigate(ScreenName.DebugPlayground)}
    />
  );
}
