// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const GenerateMockAccountsButton = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug BLE"
    onPress={() => navigation.navigate("DebugBLE")}
  />
);

export default withNavigation(GenerateMockAccountsButton);
