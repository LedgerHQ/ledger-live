import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenDebugHttpTransport() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug http transport"
      onPress={() => navigation.navigate(ScreenName.DebugHttpTransport)}
    />
  );
}
