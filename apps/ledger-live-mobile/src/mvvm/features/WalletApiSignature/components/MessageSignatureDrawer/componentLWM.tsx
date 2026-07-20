import React from "react";
import { View } from "react-native";
import { getProductName } from "@ledgerhq/devices";
import { InfoState } from "LLM/components/InfoState";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import type { SignMessageIntentJobState } from "@ledgerhq/live-common/intents/signMessageIntent";
import { useTranslation } from "~/context/Locale";
import InfiniteLoader from "~/components/InfiniteLoader";

type SignMessageIntentComponentLWMProps = Readonly<{
  jobState: SignMessageIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function SignMessageIntentComponentLWM({
  jobState,
  onClose,
}: SignMessageIntentComponentLWMProps) {
  const { t } = useTranslation();

  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "pending":
      return (
        <DeviceActionContent
          action="continue"
          description={t("walletApiSignMessage.sign.description")}
          deviceModelId={jobState.deviceModelId}
          testID="wallet-api-message-signature-prompt"
          title={t("walletApiSignMessage.sign.title", {
            productName: getProductName(jobState.deviceModelId),
          })}
        />
      );
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
          <InfiniteLoader testID="wallet-api-message-signature-loading" />
        </View>
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
