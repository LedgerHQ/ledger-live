// @flow
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugEnv() {
  const navigation = useNavigation();

  return (
    <SettingsRow
      title="Debug env"
      onPress={() => navigation.navigate(ScreenName.DebugEnv)}
    />
  );
}
