// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const BenchmarkQRStream = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Benchmark QRStream"
    onPress={() => navigation.navigate("BenchmarkQRStream")}
  />
);

export default withNavigation(BenchmarkQRStream);
