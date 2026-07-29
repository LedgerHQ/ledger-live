import React from "react";
import { UserAvatar } from "LLM/components/UserAvatar";

type Props = {
  onPress: () => void;
  showNotification: boolean;
};

export const MyWalletTopBarAction = ({ onPress, showNotification }: Readonly<Props>) => (
  <UserAvatar
    size="md"
    onPress={onPress}
    showNotification={showNotification}
    testID="topbar-mywallet"
    accessibilityLabel="My Wallet"
  />
);
