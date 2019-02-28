// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const OpenDebugSVG = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug SVG"
    onPress={() => navigation.navigate("DebugSVG")}
  />
);

export default withNavigation(OpenDebugSVG);
