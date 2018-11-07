// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const OpenDebugIcons = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug icons"
    onPress={() => navigation.navigate("DebugIcons")}
  />
);

export default withNavigation(OpenDebugIcons);
