// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const OpenDebugHttpTransport = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug http transport"
    onPress={() => navigation.navigate("DebugHttpTransport")}
  />
);

export default withNavigation(OpenDebugHttpTransport);
