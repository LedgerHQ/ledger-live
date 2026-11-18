import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  AddressDisplayed,
  AddressMismatch,
  AddressVerified,
  type VerifyAddressIntentComponentProps,
} from "@features/flow-receive";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared/react";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice, UserRefusedOnDevice } from "LLD/components/DeviceIntentExecutor";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import TranslatedError from "~/renderer/components/TranslatedError";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

function assertNever(value: never): never {
  throw new Error(`Unhandled verify address job state: ${JSON.stringify(value)}`);
}

function ErrorScreen({
  title,
  description,
  onClose,
}: Readonly<{ title: React.ReactNode; description: React.ReactNode; onClose: () => void }>) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={title}
      description={description}
      primaryCta={{ label: t("common.close"), onPress: onClose }}
      testID="receive-verify-address-error"
    />
  );
}

function MismatchScreen({ onClose }: Readonly<{ onClose: () => void }>) {
  const contactSupportUrl = useLocalizedUrl(urls.contactSupport);
  const openSupport = useCallback(() => {
    openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return <AddressMismatch onContactSupport={openSupport} onClose={onClose} />;
}

/** The dialog stays locked until the user acts on the device. */
export function VerifyAddressIntentComponentLWD({
  jobState,
  onClose,
}: VerifyAddressIntentComponentProps): React.ReactElement | null {
  if (!jobState) return null;

  switch (jobState.type) {
    case "verifying":
      return (
        <>
          <DeviceBlocker />
          <ContinueOnDevice
            deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
            deviceName={jobState.deviceName}
            testID="receive-verify-address-continue-on-device"
          />
        </>
      );
    case "addressDisplayed":
      return (
        <>
          <DeviceBlocker />
          <OverrideDeviceIntentExecutorHeader>
            <div className="h-48" aria-hidden />
          </OverrideDeviceIntentExecutorHeader>
          <AddressDisplayed />
        </>
      );
    case "verified":
      return <AddressVerified onDone={onClose} />;
    case "cancelled":
      return (
        <UserRefusedOnDevice
          onClose={onClose}
          onRetry={jobState.retry}
          testID="receive-verify-address-user-refused"
        />
      );
    case "mismatch":
      return <MismatchScreen onClose={onClose} />;
    case "unsupported":
      return (
        <ErrorScreen
          title={<TranslatedError error={jobState.error} field="title" />}
          description={<TranslatedError error={jobState.error} field="description" />}
          onClose={onClose}
        />
      );
    default:
      return assertNever(jobState);
  }
}
