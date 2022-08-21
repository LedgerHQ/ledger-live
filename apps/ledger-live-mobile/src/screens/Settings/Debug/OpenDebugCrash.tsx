import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugCrash() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug crash"
      onPress={() => navigation.navigate(ScreenName.DebugCrash)}
    />
  );
}
