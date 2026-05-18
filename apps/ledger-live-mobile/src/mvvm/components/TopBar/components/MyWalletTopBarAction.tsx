import React from "react";
import { UserAvatar } from "LLM/features/MyWallet/components/UserAvatar";
import { Pressable } from "@ledgerhq/lumen-ui-rnative";
import { Platform } from "react-native";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = {
  onPress: () => void;
  showNotification: boolean;
};

export function MyWalletTopBarAction({ onPress, showNotification }: Readonly<Props>) {
  const isAndroid = Platform.OS === "android";
  const backgroundColor: LumenViewStyle["backgroundColor"] = isAndroid
    ? "muted"
    : "mutedTransparent";

  const pressedBackgroundColor: LumenViewStyle["backgroundColor"] = isAndroid
    ? "mutedPressed"
    : "mutedTransparentPressed";

  return (
    <Pressable onPress={onPress} testID="topbar-mywallet" accessibilityLabel="My Wallet">
      {({ pressed }) => (
        <UserAvatar
          size="md"
          lx={{ backgroundColor: pressed ? pressedBackgroundColor : backgroundColor }}
          showNotification={showNotification}
        />
      )}
    </Pressable>
  );
}
