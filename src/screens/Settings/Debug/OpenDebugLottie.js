// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

const OpenLottie = ({ navigation }: { navigation: * }) => (
  <SettingsRow
    title="Debug Lottie"
    onPress={() => navigation.navigate("DebugLottie")}
  />
);

export default withNavigation(OpenLottie);
