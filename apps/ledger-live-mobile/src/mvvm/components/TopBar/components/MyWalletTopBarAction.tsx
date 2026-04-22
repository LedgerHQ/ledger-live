import React from "react";
import { UserAvatar } from "LLM/features/MyWallet/components/UserAvatar";
import { Pressable } from "@ledgerhq/lumen-ui-rnative";
import { Platform } from "react-native";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = {
  onPress: () => void;
};

export function MyWalletTopBarAction({ onPress }: Readonly<Props>) {
  const isAndroid = Platform.OS === "android";
  const backgroundColor: LumenViewStyle["backgroundColor"] = isAndroid
    ? "muted"
    : "mutedTransparent";

  return (
    <Pressable onPress={onPress} testID="topbar-mywallet" accessibilityLabel="My Wallet">
      <UserAvatar size="md" lx={{ backgroundColor }} />
    </Pressable>
  );
}
