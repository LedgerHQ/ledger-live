import React from "react";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  BottomSheetView,
  Box,
  Button,
  Stepper,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
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
  const safeAreaInsets = useSafeAreaInsets();
  const { currentStep, totalSteps, stepperLabel } = stepperDisplay;

  return (
    <BottomSheetView
      testID="post-onboarding-hub-container"
      style={{ paddingBottom: safeAreaInsets.bottom + 16 }}
    >
      <BottomSheetHeader />
      <BottomSheetScrollView showsVerticalScrollIndicator={false}>
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
          {t("postOnboarding.drawer.title")}
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
          />
        ))}

        {areAllPostOnboardingActionsCompleted ? (
          <Box lx={{ marginTop: "s24" }}>
            <Button appearance="accent" size="lg" isFull onPress={onRequestExit}>
              {t("postOnboarding.drawer.primaryLabel")}
            </Button>
          </Box>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetView>
  );
}
