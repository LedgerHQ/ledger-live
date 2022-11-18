import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/react-ui";

import { Bullet, Status as SoftwareCheckStatus } from "./shared";

export type Props = {
  genuineCheckStatus: SoftwareCheckStatus;
  firmwareUpdateStatus: SoftwareCheckStatus;
  handleSkipFirmwareUpdate: () => void;
  availableFirmwareVersion: string;
  productName: string;
};

const SoftwareCheckContent = ({
  genuineCheckStatus,
  firmwareUpdateStatus,
  availableFirmwareVersion,
  handleSkipFirmwareUpdate,
  productName,
}: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <Bullet
        mb={7}
        bulletText="1"
        status={genuineCheckStatus}
        text={
          genuineCheckStatus === SoftwareCheckStatus.completed
            ? t("syncOnboarding.manual.softwareCheckContent.genuineCheck.completed", {
                deviceName: productName,
              })
            : t("syncOnboarding.manual.softwareCheckContent.genuineCheck.active", {
                deviceName: productName,
              })
        }
      />
      <Bullet
        bulletText="2"
        status={firmwareUpdateStatus}
        text={
          firmwareUpdateStatus === SoftwareCheckStatus.inactive
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.inactive")
            : firmwareUpdateStatus === SoftwareCheckStatus.active
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.active")
            : firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.updateAvailable", {
                firmwareVersion: availableFirmwareVersion,
              })
            : t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.completed")
        }
        subText={
          firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.recommendation")
            : undefined
        }
      />
      {firmwareUpdateStatus === SoftwareCheckStatus.updateAvailable && (
        <Flex mt={2} flex="1" justifyContent="space-around">
          <Button variant="main" width="45%" padding="10px 20px">
            {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.downloadUpdate")}
          </Button>
          <Button
            variant="main"
            outline
            width="45%"
            padding="10px 20px"
            onClick={handleSkipFirmwareUpdate}
          >
            {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.skipUpdate")}
          </Button>
        </Flex>
      )}
    </>
  );
};

export default SoftwareCheckContent;
