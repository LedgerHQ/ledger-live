import React from "react";
import { UserAvatar } from "LLM/features/MyWallet/components/UserAvatar";
import { Pressable } from "@ledgerhq/lumen-ui-rnative";
import { Platform } from "react-native";
import { useTheme, LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = {
  onPress: () => void;
  showNotification: boolean;
};

export function MyWalletTopBarAction({ onPress, showNotification }: Readonly<Props>) {
  const { theme } = useTheme();
  const isAndroid = Platform.OS === "android";
  const backgroundColor: LumenViewStyle["backgroundColor"] = isAndroid
    ? "muted"
    : "mutedTransparent";

  const pressedBackgroundColor: LumenViewStyle["backgroundColor"] = isAndroid
    ? "mutedPressed"
    : "mutedTransparentPressed";

  return (
    <Pressable
      onPress={onPress}
      testID="topbar-mywallet"
      lx={{ borderRadius: "full" }}
      accessibilityLabel="My Wallet"
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.colors.bg[pressedBackgroundColor] : undefined,
      })}
    >
      <UserAvatar size="md" lx={{ backgroundColor }} showNotification={showNotification} />
    </Pressable>
  );
}
