import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function OpenLottie() {
  const navigation = useNavigation();
  return (
    <SettingsRow
      title="Debug Lottie"
      onPress={() => navigation.navigate(ScreenName.DebugLottie)}
    />
  );
}
