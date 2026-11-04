import React from "react";
import { View } from "react-native";
import { InfoState } from "@shared/ui-info-state";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { useTranslation } from "~/context/Locale";
import InfiniteLoader from "~/components/InfiniteLoader";
import { SimplifiedTransactionConfirm } from "../../components/SimplifiedTransactionConfirm";
import type { SignatureExtraProps } from "./types";

type SignTransactionIntentComponentLWMProps = Readonly<{
  jobState: SignTransactionIntentJobState | undefined;
  extraProps: SignatureExtraProps;
  onClose: () => void;
}>;

export function SignTransactionIntentComponentLWM({
  jobState,
  extraProps,
  onClose,
}: SignTransactionIntentComponentLWMProps) {
  const { t } = useTranslation();
  const sponsoredTransferTitle = extraProps.sponsoredTransfer
    ? t("send.newSendFlow.sponsoredTransferSignature.title")
    : undefined;

  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "pending":
    case "device-signature-requested":
      return (
        <SimplifiedTransactionConfirm
          deviceModelId={jobState.deviceModelId}
          title={sponsoredTransferTitle}
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
          <InfiniteLoader testID="send-signature-loading" />
        </View>
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("send.newSendFlow.sign.cancelled.title")}
          description={t("send.newSendFlow.sign.cancelled.description")}
          primaryCta={{
            label: t("send.newSendFlow.sign.cancelled.close"),
            onPress: onClose,
            testID: "send-signature-cancelled-close",
          }}
          secondaryCta={{
            label: t("send.newSendFlow.sign.cancelled.retry"),
            onPress: jobState.retry,
            testID: "send-signature-cancelled-retry",
          }}
          testID="send-signature-cancelled"
        />
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled sign transaction intent state: ${String(value)}`);
}
