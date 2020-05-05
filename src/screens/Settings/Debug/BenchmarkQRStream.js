// @flow
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

export default function BenchmarkQRStream() {
  const navigation = useNavigation();

  return (
    <SettingsRow
      title="Benchmark QRStream"
      onPress={() => navigation.navigate(ScreenName.BenchmarkQRStream)}
    />
  );
}
