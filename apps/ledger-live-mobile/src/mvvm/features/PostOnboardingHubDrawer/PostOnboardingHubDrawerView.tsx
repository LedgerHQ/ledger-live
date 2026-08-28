import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Stepper,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  Account,
  PostOnboardingAction,
  PostOnboardingActionState,
} from "@ledgerhq/types-live";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useTranslation } from "~/context/Locale";
import type { PostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import { HubStepRow } from "./components/HubStepRow";
import { HubActionItem } from "./components/HubActionItem";

export type PostOnboardingHubDrawerViewProps = Readonly<{
  deviceModelId: DeviceModelId;
  productName: string;
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[];
  isLedgerSyncActive: boolean;
  accounts: Account[];
  openActivationDrawer: () => void;
  onRequestExit: () => void;
  closeHubDrawer: () => void;
  stepperDisplay: PostOnboardingHubStepperDisplay;
  areAllPostOnboardingActionsCompleted: boolean;
}>;

export function PostOnboardingHubDrawerView({
  deviceModelId,
  productName,
  actionsState,
  isLedgerSyncActive,
  accounts,
  openActivationDrawer,
  onRequestExit,
  closeHubDrawer,
  stepperDisplay,
  areAllPostOnboardingActionsCompleted,
}: PostOnboardingHubDrawerViewProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { currentStep, totalSteps, stepperLabel } = stepperDisplay;
  const bottomSafeArea = Platform.OS === "ios" ? bottomInset : 0;
  const styles = useStyleSheet(
    theme => ({
      content: {
        paddingBottom: bottomSafeArea + theme.spacings.s24,
      },
      safeRow: {
        height: theme.spacings.s56,
      },
    }),
    [bottomSafeArea],
  );

  return (
    <BottomSheetView testID="post-onboarding-hub-container" style={styles.content}>
      <BottomSheetHeader />
      <Box
        lx={{
          alignSelf: "flex-start",
          marginBottom: "s16",
          paddingVertical: "s12",
        }}
      >
        <Box lx={{ alignSelf: "flex-start" }} style={{ transform: [{ scale: 1.12 }] }}>
          <Stepper currentStep={currentStep} totalSteps={totalSteps} label={stepperLabel} />
        </Box>
      </Box>
      <Text typography="heading3SemiBold" lx={{ color: "base", marginBottom: "s24" }}>
        {t(
          areAllPostOnboardingActionsCompleted
            ? "postOnboarding.drawer.titleCompleted"
            : "postOnboarding.drawer.title",
        )}
      </Text>

      <HubStepRow
        leadingIcon={<CheckmarkCircleFill size={24} color="success" />}
        title={t("postOnboarding.drawer.actions.deviceOnboarded.title")}
        description={t("postOnboarding.drawer.actionCompletedLabel")}
      />

      {actionsState.map(action => (
        <HubActionItem
          key={action.id}
          {...action}
          deviceModelId={deviceModelId}
          productName={productName}
          openActivationDrawer={openActivationDrawer}
          isLedgerSyncActive={isLedgerSyncActive}
          accounts={accounts}
          closeHubDrawer={closeHubDrawer}
          completionStatus={{
            isCompleted: stepperDisplay.actionCompletionById[action.id] ?? false,
            isLoading: stepperDisplay.loading,
          }}
        />
      ))}

      {areAllPostOnboardingActionsCompleted ? (
        <Box lx={{ marginTop: "s24" }}>
          <Button
            appearance="base"
            size="lg"
            isFull
            onPress={onRequestExit}
            testID="post-onboarding-hub-complete-button"
          >
            {t("postOnboarding.drawer.primaryLabel")}
          </Button>
        </Box>
      ) : (
        <Box testID="post-onboarding-hub-safe-row" style={styles.safeRow} />
      )}
    </BottomSheetView>
  );
}
