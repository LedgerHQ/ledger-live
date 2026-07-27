import React from "react";
import { View } from "react-native";
import { getProductName } from "@ledgerhq/devices";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "LLM/components/InfoState";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { useTranslation } from "~/context/Locale";

type SignTransactionIntentComponentProps = Readonly<{
  jobState: SignTransactionIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function SignTransactionIntentComponent({
  jobState,
  onClose,
}: SignTransactionIntentComponentProps) {
  const { t } = useTranslation();

  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "pending":
    case "device-signature-requested":
      return (
        <DeviceActionContent
          action="continue"
          description={t("walletApiSignTransaction.sign.description")}
          deviceModelId={jobState.deviceModelId}
          testID="wallet-api-signature-prompt"
          title={t("walletApiSignTransaction.sign.title", {
            productName: getProductName(jobState.deviceModelId),
          })}
        />
      );
    case "device-streaming":
    case "device-signature-granted":
    case "signed":
      return (
        <View
          style={{
            flex: 1,
            height: "100%",
            minHeight: 320,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner size={32} testID="wallet-api-signature-loading" />
        </View>
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
