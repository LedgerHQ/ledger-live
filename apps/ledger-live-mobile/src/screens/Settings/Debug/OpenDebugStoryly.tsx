import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenStoryly() {
  const navigation = useNavigation();

  return (
    <SettingsRow
      title="Debug Storyly"
      onPress={() => navigation.navigate(ScreenName.DebugStoryly)}
    />
  );
}
