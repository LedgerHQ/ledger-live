// @flow

import React, { useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import colors from "../../colors";
import AccountOrderModal from "./AccountOrderModal";
import RefreshAccountsOrdering from "../../components/RefreshAccountOrdering";

// update at boot and each time focus or open state changes
type RefreshAccountsProps = {
  isOpened: boolean,
};

function RefreshAccounts({ isOpened }: RefreshAccountsProps) {
  const isFocused = useIsFocused();
  return (
    <RefreshAccountsOrdering
      onUpdate
      nonce={`${isFocused}_${isOpened.toString()}`}
    />
  );
}

export default function AccountOrder() {
  const [isOpened, setIsOpened] = useState(false);

  function onPress(): void {
    setIsOpened(true);
  }

  function onClose(): void {
    setIsOpened(false);
  }

  return (
    <Touchable
      event="AccountOrderOpen"
      style={{ marginHorizontal: 16 }}
      onPress={onPress}
    >
      <Icon name="sliders" color={colors.grey} size={20} />
      <RefreshAccounts isOpened={isOpened} />
      <AccountOrderModal isOpened={isOpened} onClose={onClose} />
    </Touchable>
  );
}
