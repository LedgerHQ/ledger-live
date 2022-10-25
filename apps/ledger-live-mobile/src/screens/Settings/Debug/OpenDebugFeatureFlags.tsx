import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugFeatureFlags() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug Feature Flags"
      onPress={() => navigation.navigate(ScreenName.DebugFeatureFlags)}
    />
  );
}
