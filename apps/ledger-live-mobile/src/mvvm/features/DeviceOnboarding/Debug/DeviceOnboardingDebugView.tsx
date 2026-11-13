import React from "react";
import { StyleSheet } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Button, NavBar, NavBarBackButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import { UnseededIntroKaraokeScreen } from "LLM/features/DeviceOnboarding/screens/UnseededIntroKaraoke";
import { SyncOfferScreen } from "LLM/features/DeviceOnboarding/screens/SyncOffer";
import { RecoverKaraokePreview } from "./RecoverKaraokePreview";
import type { SyncOfferScreenProps } from "LLM/features/DeviceOnboarding/screens/SyncOffer/useSyncOfferScreenViewModel";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";

const checkPreviews: readonly ChecksScreenState[] = [
  "synchronizing",
  "idle",
  "checking",
  "awaitingAllow",
  "succeeded",
  "updating",
];

const syncPreviews = ["offer"] as const;

const karaokePreviews = ["unseededIntro", "recoverCopy1", "recoverCopy2"] as const;

const errorPreviews: readonly GenuineErrorKind[] = [
  "declined",
  "notGenuine",
  "provider",
  "network",
  "unknown",
];

type Preview =
  | ChecksScreenState
  | (typeof syncPreviews)[number]
  | (typeof karaokePreviews)[number]
  | GenuineErrorKind;

type DeviceOnboardingDebugViewProps = Readonly<{
  preview: Preview;
  isScreenOpen: boolean;
  onSelectPreview: (preview: Preview) => void;
  onBack: () => void;
  screenProps: ChecksScreenProps;
  onClosePreview: () => void;
  syncOfferProps: SyncOfferScreenProps;
}>;

export function DeviceOnboardingDebugView({
  preview,
  isScreenOpen,
  onSelectPreview,
  onBack,
  screenProps,
  onClosePreview,
  syncOfferProps,
}: DeviceOnboardingDebugViewProps) {
  if (isScreenOpen && preview === "unseededIntro") {
    return (
      <UnseededIntroKaraokeScreen
        deviceModelId={DeviceModelId.nanoX}
        onFinish={() => {
          onClosePreview();
          return true;
        }}
        onClose={onClosePreview}
      />
    );
  }

  if (isScreenOpen && preview === "recoverCopy1") {
    return <RecoverKaraokePreview variant="copy1" onClose={onClosePreview} />;
  }

  if (isScreenOpen && preview === "recoverCopy2") {
    return <RecoverKaraokePreview variant="copy2" onClose={onClosePreview} />;
  }

  if (isScreenOpen) {
    return (
      <SafeAreaView style={styles.screen}>
        {preview === "offer" ? (
          <SyncOfferScreen {...syncOfferProps} />
        ) : (
          <ChecksScreen {...screenProps} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <NavBar density="compact">
        <NavBarBackButton onPress={onBack} accessibilityLabel="Back" />
      </NavBar>
      <Box lx={{ gap: "s16", padding: "s16" }}>
        <PreviewGroup
          title="Checks"
          options={checkPreviews}
          selected={preview}
          onSelect={onSelectPreview}
        />
        <PreviewGroup
          title="Karaoke"
          options={karaokePreviews}
          selected={preview}
          onSelect={onSelectPreview}
        />
        <PreviewGroup
          title="Ledger Sync"
          options={syncPreviews}
          selected={preview}
          onSelect={onSelectPreview}
        />
        <PreviewGroup
          title="Errors"
          options={errorPreviews}
          selected={preview}
          onSelect={onSelectPreview}
        />
      </Box>
    </SafeAreaView>
  );
}

function PreviewGroup({
  title,
  options,
  selected,
  onSelect,
}: Readonly<{
  title: string;
  options: readonly Preview[];
  selected: Preview;
  onSelect: (preview: Preview) => void;
}>) {
  return (
    <Box lx={{ gap: "s8" }}>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {title}
      </Text>
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
        {options.map(option => (
          <Button
            key={option}
            size="sm"
            appearance={option === selected ? "base" : "gray"}
            onPress={() => onSelect(option)}
          >
            {option}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
