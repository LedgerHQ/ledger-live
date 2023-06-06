import React from "react";
import { Text, Flex, Icons, IconBadge } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import { TFunction } from "i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import Button from "../../components/Button";

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
  return (
    <Flex alignItems="center" justifyContent="center" px={1}>
      <IconBadge
        iconColor="primary.c100"
        iconSize={32}
        Icon={Icons.InfoAltFillMedium}
      />
      <Text fontSize={7} fontWeight="semiBold" textAlign="center" mt={6}>
        {t(
          `FirmwareUpdate.steps.restoreSettings.errors.${stepDeniedError.name}`,
          { deviceName: getDeviceModel(device.modelId).productName },
        )}
      </Text>
      <Text fontSize={4} textAlign="center" color="neutral.c80" mt={6}>
        {t("FirmwareUpdate.steps.restoreSettings.errors.description")}
      </Text>
      <Button
        type="main"
        outline={false}
        onPress={onPressRetry}
        mt={8}
        alignSelf="stretch"
      >
        {t("common.retry")}
      </Button>
      <Button
        type="default"
        outline={false}
        onPress={onPressSkip}
        mt={6}
        alignSelf="stretch"
      >
        {t("common.skip")}
      </Button>
    </Flex>
  );
};
