import React from "react";
import { Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "@shared/analytics-react";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  SpotNumber,
  Text,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { recoverRestoreTestIds } from "LLM/features/DeviceOnboarding/testIds";
import recoverShieldDark from "../../../Debug/assets/recoverShieldDark.webp";
import recoverShieldLight from "../../../Debug/assets/recoverShieldLight.webp";
import { restoreEventProps, restoreWithRecoverPage } from "./useRecoverRestoreViewModel";
import type { RecoverRestoreViewProps } from "./useRecoverRestoreViewModel";

function RecoverIllustration() {
  const { colorScheme } = useTheme();
  const source = colorScheme === "light" ? recoverShieldLight : recoverShieldDark;
  return <Image source={source} resizeMode="contain" style={styles.illustration} />;
}

const styles = StyleSheet.create({
  illustration: { width: "100%", height: 200 },
});

export function RecoverRestoreView({
  title,
  description,
  rows,
  continueLabel,
  closeLabel,
  onClose,
  onContinue,
  deviceType,
  deviceVersion,
}: RecoverRestoreViewProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box testID={recoverRestoreTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <TrackScreen
        name={restoreWithRecoverPage}
        refreshSource={false}
        {...restoreEventProps}
        {...(deviceType === null ? {} : { deviceType })}
        {...(deviceVersion === null ? {} : { deviceVersion })}
      />
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={recoverRestoreTestIds.close}
        onPress={onClose}
      />
      <Box lx={{ flex: 1, justifyContent: "center", gap: "s24", paddingHorizontal: "s16" }}>
        <RecoverIllustration />
        <Box lx={{ gap: "s8" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {title}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        </Box>
        <Box>
          {rows.map(row => (
            <ListItem key={row.id}>
              <ListItemLeading>
                <SpotNumber value={row.number} size={48} />
                <ListItemContent>
                  <ListItemDescription numberOfLines={2}>{row.description}</ListItemDescription>
                </ListItemContent>
              </ListItemLeading>
            </ListItem>
          ))}
        </Box>
      </Box>
      <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: bottom + 24 }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          testID={recoverRestoreTestIds.continue}
          onPress={onContinue}
        >
          {continueLabel}
        </Button>
      </Box>
    </Box>
  );
}
