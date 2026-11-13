import React from "react";
import { useTranslation } from "~/context/Locale";
import { AddressDisplayed } from "@features/flow-receive";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { WrongDeviceForAccount } from "@ledgerhq/ledger-wallet-framework/errors";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor";
import TranslatedError from "~/components/TranslatedError";

type Props = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

const ADDRESS_MISMATCH = new WrongDeviceForAccount();

function DeviceError({ error, onClose }: Readonly<{ error: Error; onClose: () => void }>) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{ label: t("common.close"), onPress: onClose }}
      testID="receive-verify-address-error"
    />
  );
}

/** Closing before the device confirms cancels its pending action: the executor unmounts. */
export function VerifyAddressIntentComponentLWM({
  jobState,
  onClose,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();

  if (!jobState) return null;

  switch (jobState.type) {
    case "verifying":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="receive-verify-address-continue-on-device"
        />
      );
    case "addressDisplayed":
    case "verified":
      return <AddressDisplayed onGotIt={onClose} />;
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
          primaryCta={{ label: t("common.close"), onPress: onClose }}
          secondaryCta={{ label: t("common.retry"), onPress: jobState.retry }}
          testID="receive-verify-address-refused"
        />
      );
    case "unsupported":
      return <DeviceError error={jobState.error} onClose={onClose} />;
    case "mismatch":
      return <DeviceError error={ADDRESS_MISMATCH} onClose={onClose} />;
  }
}
