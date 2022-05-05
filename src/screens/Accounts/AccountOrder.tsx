import React, { useState } from "react";
import { SortAltMedium } from "@ledgerhq/native-ui/assets/icons";
import Touchable from "../../components/Touchable";
import AccountOrderModal from "./AccountOrderModal";
import { useRefreshAccountsOrderingEffect } from "../../actions/general";

export default function AccountOrder() {
  const [isOpened, setIsOpened] = useState(false);

  function onPress(): void {
    setIsOpened(true);
  }

  function onClose(): void {
    setIsOpened(false);
  }

  useRefreshAccountsOrderingEffect({ onUnmount: true });

  return (
    <Touchable event="AccountOrderOpen" onPress={onPress}>
      <SortAltMedium size={24} />
      <AccountOrderModal isOpened={isOpened} onClose={onClose} />
    </Touchable>
  );
}
