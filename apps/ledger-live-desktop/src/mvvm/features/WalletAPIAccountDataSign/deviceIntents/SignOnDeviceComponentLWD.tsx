import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { SignAccountMessageIntentJobState } from "@features/platform-sign-account-message-intent";
import type { SignAccountTransactionIntentJobState } from "@features/platform-sign-account-transaction-intent";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type Props = Readonly<{
  jobState: SignAccountTransactionIntentJobState | SignAccountMessageIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** Desktop renderer of the sign-transaction and sign-message intents: the message states are a subset. */
export function SignOnDeviceComponentLWD({ jobState, onClose }: Props) {
  const { t } = useTranslation();

  switch (jobState?.type) {
    case "device-signature-requested":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="wallet-api-account-data-sign-continue-on-device"
        />
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("platform.accountDataSign.rejected")}
          primaryCta={{
            label: t("common.close"),
            onPress: onClose,
            testID: "wallet-api-account-data-sign-close",
          }}
          secondaryCta={{
            label: t("common.retry"),
            onPress: jobState.retry,
            testID: "wallet-api-account-data-sign-retry",
          }}
          testID="wallet-api-account-data-sign-rejected"
        />
      );
    case "device-streaming":
    case "device-signature-granted":
    case "signed":
      return (
        <LoadingContent
          title={t("platform.accountDataSign.signed")}
          testID="wallet-api-account-data-sign-signed"
        />
      );
    default:
      return (
        <LoadingContent
          title={t("platform.accountDataSign.pending")}
          testID="wallet-api-account-data-sign-pending"
        />
      );
  }
}
