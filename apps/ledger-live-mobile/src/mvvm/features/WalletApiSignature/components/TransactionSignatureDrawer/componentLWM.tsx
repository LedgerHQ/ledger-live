import React from "react";
import { View } from "react-native";
import { getProductName } from "@ledgerhq/devices";
import { InfoState } from "LLM/components/InfoState";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { useTranslation } from "~/context/Locale";
import InfiniteLoader from "~/components/InfiniteLoader";

type SignTransactionIntentComponentLWMProps = Readonly<{
  jobState: SignTransactionIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function SignTransactionIntentComponentLWM({
  jobState,
  onClose,
}: SignTransactionIntentComponentLWMProps) {
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
          <InfiniteLoader testID="wallet-api-signature-loading" />
        </View>
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("walletApiSignTransaction.sign.cancelled.title")}
          description={t("walletApiSignTransaction.sign.cancelled.description")}
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
  throw new Error(`Unhandled sign transaction intent state: ${String(value)}`);
}
