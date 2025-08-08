import React, { useCallback } from "react";
import { VerticalTimeline } from "@ledgerhq/native-ui";
import CollapsibleStep from "./CollapsibleStep";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import useCompanionSteps from "./useCompanionSteps";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FirstStepSyncOnboardingProps {
  device: Device;
  productName: string;
}

const FirstStepSyncOnboarding = ({ device, productName }: FirstStepSyncOnboardingProps) => {
  const { t } = useTranslation();
  const safeAreaInsets = useSafeAreaInsets();

  /*
   * Custom hooks
   */
  const companionSteps = useCompanionSteps({ device, productName });

  /*
   * Callbacks
   */
  const formatEstimatedTime = useCallback(
    (estimatedTime: number) =>
      t("syncOnboarding.estimatedTimeFormat", {
        estimatedTime: estimatedTime / 60,
      }),
    [t],
  );

  return (
    <CollapsibleStep isCollapsed={false} title="Get your Ledger Stax Ready" status="unfinished">
      <VerticalTimeline
        steps={companionSteps}
        formatEstimatedTime={formatEstimatedTime}
        contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}
      />
    </CollapsibleStep>
  );
};

export default FirstStepSyncOnboarding;
