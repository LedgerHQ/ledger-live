import React from "react";
import { useTranslation } from "react-i18next";
import { getProductName } from "@ledgerhq/devices";
import type { SignMessageIntentJobState } from "@ledgerhq/live-common/intents/signMessageIntent";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DeviceActionContent } from "LLD/components/DeviceActionContent";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type SignMessageIntentComponentLWDProps = Readonly<{
  jobState: SignMessageIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function SignMessageIntentComponentLWD({
  jobState,
  onClose,
}: SignMessageIntentComponentLWDProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "pending":
      return (
        <>
          <DeviceBlocker />
          <DeviceActionContent
            action="continue"
            description={t("walletApiSignMessage.sign.description")}
            deviceModelId={jobState.deviceModelId}
            testID="wallet-api-message-signature-prompt"
            title={t("walletApiSignMessage.sign.title", {
              productName: getProductName(jobState.deviceModelId),
            })}
          />
        </>
      );
    case "signed":
      return (
        <div
          className="flex min-h-320 w-full items-center justify-center"
          data-testid="wallet-api-message-signature-loading"
        >
          <Spinner size={32} />
        </div>
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("walletApiSignMessage.sign.cancelled.title")}
          primaryCta={{
            label: t("walletApiSignMessage.sign.cancelled.close"),
            onPress: onClose,
            testID: "wallet-api-message-signature-cancelled-close",
          }}
          secondaryCta={{
            label: t("walletApiSignMessage.sign.cancelled.retry"),
            onPress: jobState.retry,
            testID: "wallet-api-message-signature-cancelled-retry",
          }}
          testID="wallet-api-message-signature-cancelled"
        />
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled sign message intent state: ${JSON.stringify(value)}`);
}
