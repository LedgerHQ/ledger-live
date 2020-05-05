// @flow
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugSVG() {
  const navigation = useNavigation();

  return (
    <SettingsRow
      title="Debug SVG"
      onPress={() => navigation.navigate(ScreenName.DebugSVG)}
    />
  );
}
