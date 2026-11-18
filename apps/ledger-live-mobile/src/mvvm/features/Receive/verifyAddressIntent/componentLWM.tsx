import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  AddressDisplayed,
  AddressMismatch,
  AddressVerified,
  type VerifyAddressIntentComponentProps,
} from "@features/flow-receive";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared/react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice, UserRefusedOnDevice } from "LLM/components/DeviceIntentExecutor";
import ModalLock from "~/components/ModalLock";
import TranslatedError from "~/components/TranslatedError";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

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
  const contactSupportUrl = useLocalizedUrl(urls.contact);
  const openSupport = useCallback(() => {
    Linking.openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return <AddressMismatch onContactSupport={openSupport} onClose={onClose} />;
}

/** The drawer stays locked until the user acts on the device. */
export function VerifyAddressIntentComponentLWM({
  jobState,
  onClose,
}: VerifyAddressIntentComponentProps): React.ReactElement | null {
  if (!jobState) return null;

  switch (jobState.type) {
    case "verifying":
      return (
        <>
          <ModalLock />
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
          <ModalLock />
          <OverrideDeviceIntentExecutorHeader>
            <Box lx={{ height: "s64" }} />
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
