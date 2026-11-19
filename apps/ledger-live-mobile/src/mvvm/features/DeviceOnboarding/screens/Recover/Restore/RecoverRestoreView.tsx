import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "@shared/analytics-react";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { recoverRestoreTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { restoreEventProps, restoreWithRecoverPage } from "./useRecoverRestoreViewModel";
import type { RecoverRestoreViewProps } from "./useRecoverRestoreViewModel";

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
        <Box lx={{ alignItems: "center", justifyContent: "center" }} style={{ height: 200 }}>
          <ShieldCheck size={56} color="base" />
        </Box>
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
                <Box
                  lx={{
                    width: "s48",
                    height: "s48",
                    borderRadius: "full",
                    backgroundColor: "muted",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text typography="heading4SemiBold" lx={{ color: "base" }}>
                    {row.number}
                  </Text>
                </Box>
                <ListItemContent>
                  <ListItemDescription>{row.description}</ListItemDescription>
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
