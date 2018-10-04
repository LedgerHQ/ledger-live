// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import Button from "./Button";

const ImportAccountsButton = ({
  title,
  navigation,
}: {
  title: string,
  navigation: *,
}) => (
  <Button
    type="primary"
    title={title}
    onPress={() => navigation.navigate("ImportAccounts")}
  />
);

export default withNavigation(ImportAccountsButton);
