// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import BlueButton from "./BlueButton";

const ImportAccountsButton = ({
  title,
  navigation,
}: {
  title: string,
  navigation: *,
}) => (
  <BlueButton
    title={title}
    onPress={() => navigation.navigate("ImportAccounts")}
  />
);

export default withNavigation(ImportAccountsButton);
