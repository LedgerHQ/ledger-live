import React from "react";
import { Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Spot,
  Text,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import { IdCard, ShieldCheck, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Karaoke } from "@shared/ui-karaoke/native";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { recoverNewSeedTestIds } from "LLM/features/DeviceOnboarding/testIds";
import recoverShieldDark from "LLM/features/DeviceOnboarding/Debug/assets/recoverShieldDark.webp";
import recoverShieldLight from "LLM/features/DeviceOnboarding/Debug/assets/recoverShieldLight.webp";
import type { RecoverNewSeedViewProps, RecoverSheetPoint } from "./useRecoverNewSeedViewModel";

const pointIcons = {
  identity: IdCard,
  security: ShieldCheck,
  legacy: Wallet,
} as const satisfies Record<RecoverSheetPoint["id"], unknown>;

export function RecoverNewSeedView({
  phrases,
  tapLabel,
  closeLabel,
  title,
  description,
  price,
  protectLabel,
  skipLabel,
  onAdvance,
  onProtect,
  onSkip,
  onClose,
  sheet,
}: RecoverNewSeedViewProps) {
  return (
    <Karaoke.Root
      phrases={phrases}
      tapLabel={tapLabel}
      onAdvance={onAdvance}
      testID={recoverNewSeedTestIds.screen}
    >
      <Karaoke.Sequence />
      <Karaoke.Final>
        <Explanation
          title={title}
          description={description}
          price={price}
          protectLabel={protectLabel}
          skipLabel={skipLabel}
          onProtect={onProtect}
          onSkip={onSkip}
        />
      </Karaoke.Final>
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={recoverNewSeedTestIds.close}
        onPress={onClose}
      />
      {sheet ? <DetailSheet {...sheet} /> : null}
    </Karaoke.Root>
  );
}

function Explanation({
  title,
  description,
  price,
  protectLabel,
  skipLabel,
  onProtect,
  onSkip,
}: Readonly<
  Pick<
    RecoverNewSeedViewProps,
    "title" | "description" | "price" | "protectLabel" | "skipLabel" | "onProtect" | "onSkip"
  >
>) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1, paddingHorizontal: "s16" }} style={{ paddingBottom: bottom + 16 }}>
      <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s16" }}>
        <RecoverIllustration />
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {description}
        </Text>
      </Box>
      <Box lx={{ gap: "s16" }}>
        <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
          {price}
        </Text>
        <Button
          appearance="base"
          size="lg"
          isFull
          testID={recoverNewSeedTestIds.protect}
          onPress={onProtect}
        >
          {protectLabel}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          testID={recoverNewSeedTestIds.skip}
          onPress={onSkip}
        >
          {skipLabel}
        </Button>
      </Box>
    </Box>
  );
}

function RecoverIllustration() {
  const { colorScheme } = useTheme();
  const source = colorScheme === "light" ? recoverShieldLight : recoverShieldDark;
  return <Image source={source} resizeMode="contain" style={styles.illustration} />;
}

const styles = StyleSheet.create({
  illustration: { width: "100%", height: 200 },
});

function DetailSheet({
  title,
  points,
  startLabel,
  remindLabel,
  onStart,
  onRemind,
  onClose,
  onOpened,
}: NonNullable<RecoverNewSeedViewProps["sheet"]>) {
  const { bottom } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={onClose}
      onOpened={onOpened}
      enableDynamicSizing
      contentHasBottomSpace
      testID={recoverNewSeedTestIds.sheet}
    >
      <BottomSheetView style={{ paddingBottom: bottom + 16 }}>
        <BottomSheetHeader />
        <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
          <Box>
            {points.map(point => (
              <ListItem key={point.id}>
                <ListItemLeading>
                  <Spot size={40} icon={pointIcons[point.id]} />
                  <ListItemContent>
                    <ListItemTitle>{point.title}</ListItemTitle>
                    <ListItemDescription>{point.description}</ListItemDescription>
                  </ListItemContent>
                </ListItemLeading>
              </ListItem>
            ))}
          </Box>
          <Box lx={{ gap: "s16" }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              testID={recoverNewSeedTestIds.sheetStart}
              onPress={onStart}
            >
              {startLabel}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              isFull
              testID={recoverNewSeedTestIds.sheetRemind}
              onPress={onRemind}
            >
              {remindLabel}
            </Button>
          </Box>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
