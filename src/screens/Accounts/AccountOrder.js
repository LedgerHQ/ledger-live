// @flow

import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import AccountOrderModal from "./AccountOrderModal";
import { useRefreshAccountsOrderingEffect } from "../../actions/general";

export default function AccountOrder() {
  const { colors } = useTheme();
  const [isOpened, setIsOpened] = useState(false);

  function onPress(): void {
    setIsOpened(true);
  }

  function onClose(): void {
    setIsOpened(false);
  }

  useRefreshAccountsOrderingEffect({ onUnmount: true });

  return (
    <Touchable
      event="AccountOrderOpen"
      style={{ marginHorizontal: 16 }}
      onPress={onPress}
    >
      <Icon name="sliders" color={colors.grey} size={20} />
      <AccountOrderModal isOpened={isOpened} onClose={onClose} />
    </Touchable>
  );
}
