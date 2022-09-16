import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugStore() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug store"
      onPress={() => navigation.navigate(ScreenName.DebugStore)}
    />
  );
}
