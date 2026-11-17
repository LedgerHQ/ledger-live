import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lottie, resolveLottieSource } from "LLM/components/Lottie";
import SkipLedgerSyncDrawer from "LLM/components/SkipLedgerSyncDrawer";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { syncOfferTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { SyncOfferViewProps } from "./useSyncOfferScreenViewModel";
import darkCloudSyncAnimation from "./animations/dark/cloud-sync.lottie";
import lightCloudSyncAnimation from "./animations/light/cloud-sync.lottie";
import darkLoadingAnimation from "../Checks/animations/dark/loading.lottie";
import darkSuccessAnimation from "../Checks/animations/dark/success.lottie";
import lightLoadingAnimation from "../Checks/animations/light/loading.lottie";
import lightSuccessAnimation from "../Checks/animations/light/success.lottie";

const illustrationHeight = 200;
const illustrationSize = 96;
const cloudSyncSources = {
  light: resolveLottieSource(lightCloudSyncAnimation),
  dark: resolveLottieSource(darkCloudSyncAnimation),
};
const successSources = {
  light: resolveLottieSource(lightSuccessAnimation),
  dark: resolveLottieSource(darkSuccessAnimation),
};
const loadingSources = {
  light: resolveLottieSource(lightLoadingAnimation),
  dark: resolveLottieSource(darkLoadingAnimation),
};

type AnimationSources = typeof successSources;

function useOfferTheme() {
  const { colorScheme } = useTheme();
  return colorScheme === "dark" ? "dark" : "light";
}

function OfferLayout({
  title,
  closeLabel,
  onQuit,
  sources,
  loop,
  body,
  footer,
  trailing,
}: Readonly<{
  title: string;
  closeLabel: string;
  onQuit: () => void;
  sources: AnimationSources;
  loop: boolean;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  trailing?: React.ReactNode;
}>) {
  const theme = useOfferTheme();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <Box testID={syncOfferTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <Box lx={{ flex: 1, gap: "s24" }}>
        <DeviceOnboardingCloseBar
          label={closeLabel}
          testID={syncOfferTestIds.quit}
          onPress={onQuit}
        />
        <Box
          lx={{ alignItems: "center", justifyContent: "center", minHeight: "s72", flexShrink: 1 }}
          style={{ height: illustrationHeight }}
        >
          <Lottie
            key={theme}
            source={sources[theme]}
            loop={loop}
            style={{ width: illustrationSize, height: illustrationSize }}
          />
        </Box>
        <Box lx={{ flexGrow: 1, gap: "s8", paddingHorizontal: "s16", paddingBottom: "s16" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {title}
          </Text>
          {body}
        </Box>
        {footer ? (
          <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: bottomInset }}>
            {footer}
          </Box>
        ) : null}
      </Box>
      {trailing}
    </Box>
  );
}

function SyncOfferSuccess({
  title,
  continueLabel,
  closeLabel,
  onContinue,
  onQuit,
}: Extract<SyncOfferViewProps, { phase: "success" }>) {
  return (
    <OfferLayout
      title={title}
      closeLabel={closeLabel}
      onQuit={onQuit}
      sources={successSources}
      loop={false}
      footer={
        <Button
          appearance="base"
          size="lg"
          isFull
          testID={syncOfferTestIds.continue}
          onPress={onContinue}
        >
          {continueLabel}
        </Button>
      }
    />
  );
}

function SyncOfferSynchronizing({
  title,
  closeLabel,
  onQuit,
}: Extract<SyncOfferViewProps, { phase: "synchronizing" }>) {
  return (
    <OfferLayout
      title={title}
      closeLabel={closeLabel}
      onQuit={onQuit}
      sources={loadingSources}
      loop
    />
  );
}

function SyncOfferPrompt({
  title,
  description,
  learnMoreLabel,
  activateLabel,
  skipLabel,
  closeLabel,
  onActivate,
  onOpenSkip,
  onLearnMore,
  onQuit,
  skipDrawer,
}: Extract<SyncOfferViewProps, { phase: "offer" }>) {
  return (
    <OfferLayout
      title={title}
      closeLabel={closeLabel}
      onQuit={onQuit}
      sources={cloudSyncSources}
      loop
      body={
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {description}
          {"\n\n"}
          <Text
            typography="body2"
            accessibilityRole="link"
            testID={syncOfferTestIds.learnMore}
            onPress={onLearnMore}
            style={{ textDecorationLine: "underline" }}
          >
            {learnMoreLabel}
          </Text>
        </Text>
      }
      footer={
        <Box lx={{ gap: "s16" }}>
          <Button
            appearance="base"
            size="lg"
            isFull
            testID={syncOfferTestIds.activate}
            onPress={onActivate}
          >
            {activateLabel}
          </Button>
          <Button
            appearance="transparent"
            size="lg"
            isFull
            testID={syncOfferTestIds.skip}
            onPress={onOpenSkip}
          >
            {skipLabel}
          </Button>
        </Box>
      }
      trailing={
        <SkipLedgerSyncDrawer
          isOpen={skipDrawer.isOpen}
          handleClose={skipDrawer.onClose}
          openSync={skipDrawer.onActivate}
          skipSync={skipDrawer.onSkip}
        />
      }
    />
  );
}

export function SyncOfferView(props: SyncOfferViewProps) {
  if (props.phase === "success") return <SyncOfferSuccess {...props} />;
  if (props.phase === "synchronizing") return <SyncOfferSynchronizing {...props} />;
  return <SyncOfferPrompt {...props} />;
}
