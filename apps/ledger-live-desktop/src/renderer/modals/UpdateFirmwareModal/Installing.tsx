import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import { Title } from "~/renderer/components/DeviceAction/rendering";
import Text from "~/renderer/components/Text";
import { Flex, ProgressLoader } from "@ledgerhq/react-ui";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

type Props = {
  progress?: number;
  isInstalling?: boolean;
  current: number | null | undefined;
  total: number | null | undefined;
  deviceModelId: DeviceModelId;
};

function Installing({ progress, isInstalling, current, total, deviceModelId }: Props) {
  const { t } = useTranslation();
  const normalProgress = (progress || 0) * 100;
  const deviceModel = getDeviceModel(deviceModelId);

  return (
    <Box my={5} alignItems="center">
      <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
        <ProgressLoader
          stroke={8}
          infinite={!normalProgress}
          progress={normalProgress}
          showPercentage={!!normalProgress}
        />
      </Flex>
      <Title>
        {isInstalling && current && total
          ? t(`manager.modal.steps.progressStep`, { current, total })
          : t(`manager.modal.steps.progress`)}
      </Title>
      <Text mt={2} ff="Inter|Regular" textAlign="center" color="palette.text.shade60">
        {t("manager.modal.mcuRestart", { device: deviceModel.productName })}
      </Text>
    </Box>
  );
}

export default Installing;
