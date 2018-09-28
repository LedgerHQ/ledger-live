// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import Button from "./Button";

const GenerateMockAccountsButton = ({ navigation }: { navigation: * }) => (
  <Button
    type="secondary"
    title="Debug BLE"
    onPress={() => navigation.navigate("DebugBLE")}
    containerStyle={{ marginTop: 20 }}
  />
);

export default withNavigation(GenerateMockAccountsButton);
