import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Lottie } from "@shared/lottie/native";
import securityAnimation from "../../ProductTour/Drawer/animations/security.lottie";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { Karaoke } from "@shared/ui-karaoke/native";

/** Preview copy from Figma, for PM review. LIVE-40315 owns the real screen and wording. */
const phrasesByVariant = {
  copy1: [
    "You’ve taken the first step toward ownership",
    "But what if your backup(s) got lost or damaged?",
    "Increase your security",
  ],
  copy2: [
    "There’s no such thing as too many backups.",
    "Especially an encrypted digital backup.",
    "A digital backup that’s there when you need it.",
  ],
} as const;

export type RecoverKaraokeVariant = keyof typeof phrasesByVariant;

type RecoverKaraokePreviewProps = Readonly<{
  variant: RecoverKaraokeVariant;
  onClose: () => void;
}>;

export function RecoverKaraokePreview({ variant, onClose }: RecoverKaraokePreviewProps) {
  return (
    <Karaoke.Root phrases={phrasesByVariant[variant]} tapLabel="Tap to continue">
      <Karaoke.Sequence />
      <Karaoke.Final>
        <RecoverPitch onProtect={onClose} onSkip={onClose} />
      </Karaoke.Final>
      <DeviceOnboardingCloseBar label="Close" testID="recover-karaoke-close" onPress={onClose} />
    </Karaoke.Root>
  );
}

function RecoverPitch({
  onProtect,
  onSkip,
}: Readonly<{ onProtect: () => void; onSkip: () => void }>) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1, paddingHorizontal: "s16" }} style={{ paddingBottom: bottom + 16 }}>
      <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s16" }}>
        <Lottie
          autoPlay
          loop={false}
          style={{ width: 240, height: 240 }}
          source={securityAnimation as unknown as string}
        />
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          Protect access to your wallet with Ledger Recover.
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          It keeps an encrypted backup linked to your identity.
        </Text>
      </Box>
      <Box lx={{ gap: "s16" }}>
        <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
          First month free then start at $9,99/month. Cancel anytime. T&Cs apply
        </Text>
        <Button appearance="base" size="lg" isFull onPress={onProtect}>
          Protect my wallet
        </Button>
        <Button appearance="gray" size="lg" isFull onPress={onSkip}>
          Skip for now
        </Button>
      </Box>
    </Box>
  );
}
