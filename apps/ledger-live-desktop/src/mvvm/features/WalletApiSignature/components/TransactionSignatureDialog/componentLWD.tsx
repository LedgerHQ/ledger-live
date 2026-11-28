import React from "react";
import { useTranslation } from "react-i18next";
import { getProductName } from "@ledgerhq/devices";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DeviceActionContent } from "LLD/components/DeviceActionContent";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { TermsAndConditionsFooter } from "./TermsAndConditionsFooter";
import type { SignTransactionIntentComponentExtraProps } from "./types";

type SignTransactionIntentComponentLWDProps = Readonly<{
  jobState: SignTransactionIntentJobState | undefined;
  extraProps: SignTransactionIntentComponentExtraProps;
  onClose: () => void;
}>;

export function SignTransactionIntentComponentLWD({
  jobState,
  extraProps,
  onClose,
}: SignTransactionIntentComponentLWDProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "pending":
    case "device-signature-requested":
      return (
        <div className="flex w-full flex-col items-center gap-24">
          <DeviceBlocker />
          <DeviceActionContent
            action="continue"
            description={t("walletApiSignTransaction.sign.description")}
            deviceModelId={jobState.deviceModelId}
            testID="wallet-api-signature-prompt"
            title={t("walletApiSignTransaction.sign.title", {
              productName: getProductName(jobState.deviceModelId),
            })}
          />
          <TermsAndConditionsFooter
            manifestId={extraProps.manifestId}
            manifestName={extraProps.manifestName}
            recipient={extraProps.recipient}
          />
        </div>
      );
    case "device-streaming":
    case "device-signature-granted":
    case "signed":
      return (
        <div
          className="flex min-h-320 w-full items-center justify-center"
          data-testid="wallet-api-signature-loading"
        >
          {jobState.type !== "signed" && <DeviceBlocker />}
          <Spinner size={32} />
        </div>
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("walletApiSignTransaction.sign.cancelled.title")}
          primaryCta={{
            label: t("walletApiSignTransaction.sign.cancelled.close"),
            onPress: onClose,
            testID: "wallet-api-signature-cancelled-close",
          }}
          secondaryCta={{
            label: t("walletApiSignTransaction.sign.cancelled.retry"),
            onPress: jobState.retry,
            testID: "wallet-api-signature-cancelled-retry",
          }}
          testID="wallet-api-signature-cancelled"
        />
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled sign transaction intent state: ${JSON.stringify(value)}`);
}
