import React from "react";
import { Text, Flex, IconsLegacy, IconBadge } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import type { TFunction } from "i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import Button from "~/components/wrappedUi/Button";
import Link from "~/components/wrappedUi/Link";
import { TrackScreen } from "~/analytics";

export const RestoreStepDenied = ({
  t,
  device,
  onPressRetry,
  onPressSkip,
  stepDeniedError,
}: {
  t: TFunction;
  device: Device;
  onPressRetry: () => void;
  onPressSkip: () => void;
  stepDeniedError: Error;
}) => {
  const errorName = stepDeniedError?.name;
  let analyticsDrawerName: string;
  if (errorName === "LanguageInstallRefusedOnDevice") {
    analyticsDrawerName = `Error: the language change was cancelled on the device`;
  } else if (
    errorName === "ImageLoadRefusedOnDevice" ||
    errorName === "ImageCommitRefusedOnDevice"
  ) {
    analyticsDrawerName = `Error: the restoration of lock screen picture was cancelled on the device`;
  } else if (errorName === "UserRefusedAllowManager") {
    analyticsDrawerName = `Error: the restoration of apps was cancelled on the device`;
  } else {
    analyticsDrawerName = `Error: ${errorName}`;
  }
  return (
    <Flex alignItems="center" justifyContent="center" px={1}>
      <TrackScreen category={analyticsDrawerName} refreshSource={false} />
      <IconBadge iconColor="primary.c100" iconSize={32} Icon={IconsLegacy.InfoAltFillMedium} />
      <Text fontSize={7} fontWeight="semiBold" textAlign="center" mt={6}>
        {
          t(`FirmwareUpdate.steps.restoreSettings.errors.${stepDeniedError.name}`, {
            deviceName: getDeviceModel(device.modelId).productName,
          }) as string
        }
      </Text>
      <Text fontSize={4} textAlign="center" color="neutral.c80" mt={6}>
        {t("FirmwareUpdate.steps.restoreSettings.errors.description") as string}
      </Text>
      <Button
        event="button_clicked"
        eventProperties={{
          button: "Retry",
          page: "Firmware update",
          drawer: analyticsDrawerName,
        }}
        type="main"
        outline={false}
        onPress={onPressRetry}
        mt={8}
        alignSelf="stretch"
      >
        {t("common.retry") as string}
      </Button>
      <Flex mt={8} mb={6} alignSelf="stretch">
        <Link
          event="button_clicked"
          eventProperties={{
            button: "Skip",
            page: "Firmware update",
            drawer: analyticsDrawerName,
          }}
          onPress={onPressSkip}
        >
          {t("common.skip") as string}
        </Link>
      </Flex>
    </Flex>
  );
};
