// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const OpenDebugStore = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug store"
    onPress={() => navigation.navigate("DebugStore")}
  />
);

export default withNavigation(OpenDebugStore);
