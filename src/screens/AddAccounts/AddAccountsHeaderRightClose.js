// @flow

import React from "react";
import type { NavigationScreenProp } from "react-navigation";

import HeaderRightClose from "../../components/HeaderRightClose";

type Props = {
  navigation: NavigationScreenProp<*>,
};

export default function AddAccountsHeaderRightClose({ navigation }: Props) {
  return (
    <HeaderRightClose
      navigation={navigation}
      withConfirmation
      confirmationTitle="Cancel add account"
      confirmationDesc="You are about to cancel the Add account flow, do you wish to continue?"
    />
  );
}
