import React from "react";
import { StyleSheet, View } from "react-native";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { getProductName } from "@ledgerhq/devices";
import { InfoState } from "@shared/ui-info-state";
import type { SignRawTransactionIntentJobState } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { useTranslation } from "~/context/Locale";

export type RentSignatureExtraProps = Readonly<{
  strategyLabel: string;
  feeLabel: string | null;
}>;

const styles = StyleSheet.create({
  loading: { flex: 1, minHeight: 320, alignItems: "center", justifyContent: "center" },
});

type SignRawTransactionIntentComponentLWMProps = Readonly<{
  jobState: SignRawTransactionIntentJobState | undefined;
  extraProps: RentSignatureExtraProps;
  onClose: () => void;
}>;

export function SignRawTransactionIntentComponentLWM({
  jobState,
  extraProps,
  onClose,
}: SignRawTransactionIntentComponentLWMProps) {
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
          deviceModelId={jobState.deviceModelId}
          title={t("send.newSendFlow.sign.title", {
            wording: getProductName(jobState.deviceModelId),
          })}
          description={t("send.newSendFlow.sign.description")}
          banner={{
            title: extraProps.strategyLabel,
            description: extraProps.feeLabel ?? undefined,
          }}
          testID="send-sponsored-rent-signature-prompt"
        />
      );
    case "device-streaming":
    case "device-signature-granted":
    case "signed":
      return (
        <View style={styles.loading} testID="send-sponsored-rent-signature-loading">
          <Spinner size={32} color="base" />
        </View>
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("send.newSendFlow.sponsoredRentSignature.cancelled.title")}
          description={t("send.newSendFlow.sponsoredRentSignature.cancelled.description")}
          primaryCta={{
            label: t("send.newSendFlow.sign.cancelled.close"),
            onPress: onClose,
            testID: "send-sponsored-rent-signature-cancelled-close",
          }}
          secondaryCta={{
            label: t("send.newSendFlow.sign.cancelled.retry"),
            onPress: jobState.retry,
            testID: "send-sponsored-rent-signature-cancelled-retry",
          }}
          testID="send-sponsored-rent-signature-cancelled"
        />
      );
  }
}
