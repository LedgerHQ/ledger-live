// @flow
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugLogs() {
  const navigation = useNavigation();

  return (
    <SettingsRow
      title="Debug logs"
      onPress={() => navigation.navigate(ScreenName.DebugLogs)}
    />
  );
}
