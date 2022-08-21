import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugIcons() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug icons"
      onPress={() => navigation.navigate(ScreenName.DebugIcons)}
    />
  );
}
