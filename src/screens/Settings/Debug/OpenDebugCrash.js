// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const OpenDebugCrash = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug crash"
    onPress={() => navigation.navigate("DebugCrash")}
  />
);

export default withNavigation(OpenDebugCrash);
