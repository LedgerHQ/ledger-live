import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type Props = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** Desktop renderer of the verify-address intent for a Wallet API receive. */
export function VerifyReceiveAddressComponentLWD({ jobState, onClose }: Props) {
  const { t } = useTranslation();
  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "wallet-api-account-data-receive-close",
  };

  switch (jobState?.type) {
    case undefined:
      return (
        <LoadingContent
          title={t("platform.accountDataSign.pending")}
          testID="wallet-api-account-data-receive-pending"
        />
      );
    case "verifying":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="wallet-api-account-data-receive-continue-on-device"
        />
      );
    case "verified":
      return (
        <LoadingContent
          title={t("platform.accountDataSign.receive.verified")}
          testID="wallet-api-account-data-receive-verified"
        />
      );
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("platform.accountDataSign.rejected")}
          primaryCta={closeCta}
          secondaryCta={{
            label: t("common.retry"),
            onPress: jobState.retry,
            testID: "wallet-api-account-data-receive-retry",
          }}
          testID="wallet-api-account-data-receive-rejected"
        />
      );
    case "mismatch":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("platform.accountDataSign.receive.mismatch")}
          primaryCta={closeCta}
          testID="wallet-api-account-data-receive-mismatch"
        />
      );
    case "unsupported":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("platform.accountDataSign.receive.unsupported")}
          primaryCta={closeCta}
          testID="wallet-api-account-data-receive-unsupported"
        />
      );
  }
}
