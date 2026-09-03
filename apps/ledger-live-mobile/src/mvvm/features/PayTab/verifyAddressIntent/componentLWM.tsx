import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "@shared/i18n";

type Props = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

const DEVICE_SCREEN = {
  cancelled: {
    preset: "info",
    title: "payTab.request.verifyAddress.device.cancelledTitle",
    description: "payTab.request.verifyAddress.device.cancelledDescription",
    testID: "pay-card-verify-address-cancelled",
    showRetry: true,
  },
  mismatch: {
    preset: "error",
    title: "payTab.request.verifyAddress.device.mismatchTitle",
    description: "payTab.request.verifyAddress.device.mismatchDescription",
    testID: "pay-card-verify-address-mismatch",
    showRetry: false,
  },
  unsupported: {
    preset: "error",
    title: "payTab.request.verifyAddress.device.unsupportedTitle",
    description: "payTab.request.verifyAddress.device.unsupportedDescription",
    testID: "pay-card-verify-address-unsupported",
    showRetry: false,
  },
} as const;

function NextStepsScreen({ onGotIt }: Readonly<{ onGotIt: () => void }>) {
  const { t } = useTranslation();
  const steps = [
    { index: 1 as const, label: t("payTab.request.verifyAddress.nextStepShare") },
    { index: 2 as const, label: t("payTab.request.verifyAddress.nextStepMatch") },
  ];

  return (
    <InfoState
      preset="spot"
      size="hug"
      spotProps={{ icon: ShieldLock }}
      title={t("payTab.request.verifyAddress.successTitle")}
      content={
        <Box lx={{ backgroundColor: "muted", borderRadius: "lg", gap: "s20", padding: "s20" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("payTab.request.verifyAddress.nextStepsLabel")}
          </Text>
          {steps.map(step => (
            <Box
              key={`${step.label}-${step.index}`}
              lx={{ alignItems: "center", flexDirection: "row", gap: "s12" }}
            >
              <Spot appearance="number" number={step.index} size={32} />
              <Text typography="body2" lx={{ color: "base", flexShrink: 1 }}>
                {step.label}
              </Text>
            </Box>
          ))}
        </Box>
      }
      primaryCta={{
        label: t("payTab.request.verifyAddress.gotItCta"),
        onPress: onGotIt,
        testID: "pay-card-verify-address-got-it-cta",
      }}
      testID="pay-card-verify-address-next-steps"
    />
  );
}

export function VerifyAddressIntentComponentLWM({
  jobState,
  onClose,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();

  if (!jobState) return null;
  if (jobState.type === "verifying" || jobState.type === "verified") {
    return <NextStepsScreen onGotIt={onClose} />;
  }

  const screen = DEVICE_SCREEN[jobState.type];
  const closeCta = {
    label: t("payTab.request.verifyAddress.device.closeCta"),
    onPress: onClose,
    testID: "pay-card-verify-address-close-cta",
  };

  return (
    <InfoState
      preset={screen.preset}
      size="hug"
      title={t(screen.title)}
      description={t(screen.description)}
      primaryCta={
        screen.showRetry && jobState.type === "cancelled"
          ? {
              label: t("payTab.request.verifyAddress.device.retryCta"),
              onPress: jobState.retry,
              testID: "pay-card-verify-address-retry-cta",
            }
          : closeCta
      }
      secondaryCta={screen.showRetry ? closeCta : undefined}
      testID={screen.testID}
    />
  );
}
