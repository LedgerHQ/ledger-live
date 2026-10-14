import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box, Link, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import forgetDeviceIllustration from "~/components/BleDevicePairingFlow/assets/forget-device.webp";

type PeerRemovedPairingStateProps = {
  title: string;
  description: string;
  helpLabel: string;
  retryLabel: string;
  onHelp: () => void;
  onRetry: () => void;
};

export function PeerRemovedPairingState({
  title,
  description,
  helpLabel,
  retryLabel,
  onHelp,
  onRetry,
}: Readonly<PeerRemovedPairingStateProps>): React.ReactNode {
  return (
    <Box lx={{ width: "full" }}>
      <Box lx={{ gap: "s32", paddingVertical: "s24", width: "full" }}>
        <Box lx={{ alignItems: "center", gap: "s24", justifyContent: "center", width: "full" }}>
          <Box
            lx={{
              alignItems: "center",
              borderRadius: "sm",
              height: "s208",
              justifyContent: "center",
              overflow: "hidden",
              width: "s208",
            }}
          >
            <Image
              source={forgetDeviceIllustration}
              resizeMode="contain"
              style={styles.forgetDeviceIllustration}
            />
          </Box>
          <Box lx={{ alignItems: "center", gap: "s8", width: "full" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {description}
            </Text>
          </Box>
        </Box>

        <Box lx={{ gap: "s16", width: "full" }}>
          <Pressable
            accessibilityRole="button"
            onPress={onHelp}
            lx={{
              alignItems: "center",
              backgroundColor: "interactive",
              borderRadius: "full",
              flexDirection: "row",
              gap: "s8",
              justifyContent: "center",
              paddingHorizontal: "s16",
              paddingVertical: "s16",
              width: "full",
            }}
            style={({ pressed }) => (pressed ? styles.pressedButton : undefined)}
          >
            <Text typography="body1SemiBold" lx={{ color: "onInteractive", textAlign: "center" }}>
              {helpLabel}
            </Text>
            <ExternalLink
              size={20}
              color="onInteractive"
              testID="peer-removed-help-external-link-icon"
            />
          </Pressable>
          <Box lx={{ alignItems: "center" }}>
            <Link appearance="base" size="md" underline={false} onPress={onRetry}>
              {retryLabel}
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  forgetDeviceIllustration: {
    height: 172,
    width: 198,
  },
  pressedButton: {
    opacity: 0.8,
  },
});
