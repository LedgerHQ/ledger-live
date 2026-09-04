import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { ShieldLock } from "@ledgerhq/lumen-ui-react/symbols";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import { InfoState } from "@shared/ui-info-state";

type Props = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Shown while the address sits on the device's Secure Screen. The user reads the
 * next steps while confirming on device; "Got it" is the manual way out — leaving
 * unmounts the executor, which cancels the pending device action.
 */
function NextStepsScreen({ onGotIt }: Readonly<{ onGotIt: () => void }>) {
  const { t } = useTranslation();
  const steps = [
    { index: 1, label: t("payTab.request.verifyAddress.nextStepShare") },
    { index: 2, label: t("payTab.request.verifyAddress.nextStepMatch") },
  ] as const;

  return (
    <InfoState
      preset="spot"
      size="hug"
      spotProps={{ icon: ShieldLock, size: 56 }}
      backgroundTone="info"
      title={t("payTab.request.verifyAddress.successTitle")}
      content={
        <div className="flex w-full flex-col gap-16 rounded-md bg-surface p-16 text-left">
          <span className="body-2 text-muted">
            {t("payTab.request.verifyAddress.nextStepsLabel")}
          </span>
          <ol className="flex flex-col gap-16">
            {steps.map(step => (
              <li key={step.index} className="flex flex-row items-center justify-start gap-12">
                <Spot appearance="number" number={step.index} size={32} />
                <span className="body-2 text-base">{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
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

/**
 * Desktop renderer for the shared verify-address device intent. It maps each
 * {@link VerifyAddressIntentJobState} to a screen; generic device failures are
 * handled upstream by the executor's shared error screen.
 */
export function VerifyAddressIntentComponentLWD({
  jobState,
  onClose,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();

  // The executor mounts this component before the job emits its first state.
  if (!jobState) return null;

  switch (jobState.type) {
    case "verifying":
    case "verified":
      return <NextStepsScreen onGotIt={onClose} />;
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("payTab.request.verifyAddress.device.cancelledTitle")}
          description={t("payTab.request.verifyAddress.device.cancelledDescription")}
          primaryCta={{
            label: t("payTab.request.verifyAddress.device.retryCta"),
            onPress: jobState.retry,
            testID: "pay-card-verify-address-retry-cta",
          }}
          secondaryCta={{
            label: t("payTab.request.verifyAddress.device.closeCta"),
            onPress: onClose,
            testID: "pay-card-verify-address-close-cta",
          }}
          testID="pay-card-verify-address-cancelled"
        />
      );
    case "mismatch":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("payTab.request.verifyAddress.device.mismatchTitle")}
          description={t("payTab.request.verifyAddress.device.mismatchDescription")}
          primaryCta={{
            label: t("payTab.request.verifyAddress.device.closeCta"),
            onPress: onClose,
            testID: "pay-card-verify-address-close-cta",
          }}
          testID="pay-card-verify-address-mismatch"
        />
      );
    case "unsupported":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("payTab.request.verifyAddress.device.unsupportedTitle")}
          description={t("payTab.request.verifyAddress.device.unsupportedDescription")}
          primaryCta={{
            label: t("payTab.request.verifyAddress.device.closeCta"),
            onPress: onClose,
            testID: "pay-card-verify-address-close-cta",
          }}
          testID="pay-card-verify-address-unsupported"
        />
      );
  }
}
