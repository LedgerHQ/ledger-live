import React from "react";
import { Button, Flex, Text, InfiniteLoader } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

import Check from "~/renderer/icons/Check";
import { SoftwareCheckStatus } from "./SoftwareCheckStep";
import InfoCircle from "~/renderer/icons/InfoCircle";

export const BorderFlex = styled(Flex)`
  background-color: ${p => p.theme.colors.palette.neutral.c30};
  border-radius: 35px;
`;

export const IconContainer = styled(BorderFlex).attrs({
  width: 60,
  height: 60,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
})`
  color: ${p => p.theme.colors.palette.neutral.c100};
`;

export const Row = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
})``;

export const Column = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
})``;

enum Status {
  inactive = "inactive",
  active = "active",
  updateAvailable = "updateAvailable",
  completed = "completed",
}

type StatusType = "inactive" | "active" | "updateAvailable" | "completed";

const Bullet = ({
  status,
  bulletText,
  text,
  subText,
}: {
  status: StatusType;
  bulletText?: string | number;
  text: string;
  subText?: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Row mb={8}>
        <IconContainer>
          {status === Status.active ? (
            <InfiniteLoader />
          ) : status === Status.completed ? (
            <Check size={24} color={theme.colors.palette.success.c50} />
          ) : status === Status.updateAvailable ? (
            <InfoCircle size={24} color={theme.colors.palette.constant.purple} />
          ) : (
            <Text fontSize="20px">{bulletText}</Text>
          )}
        </IconContainer>
        <Column flex="1" ml={4}>
          <Text variant="body">{text}</Text>
          {subText && (
            <Text mt={2} variant="small" color="palette.neutral.c80">
              {subText}
            </Text>
          )}
        </Column>
      </Row>
      {status === Status.updateAvailable && (
        <Flex mt={2} flex="1" justifyContent="space-around">
          <Button variant="main" width="45%" padding="10px 20px">
            {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.downloadUpdate")}
          </Button>
          <Button variant="main" outline width="45%" padding="10px 20px">
            {t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.skipUpdate")}
          </Button>
        </Flex>
      )}
    </>
  );
};

export type Props = {
  genuineCheckStatus: SoftwareCheckStatus;
  firmwareUpdateStatus: SoftwareCheckStatus;
};

const SoftwareCheckContent = ({ genuineCheckStatus, firmwareUpdateStatus }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <Bullet
        bulletText="1"
        status={genuineCheckStatus}
        text={
          genuineCheckStatus === SoftwareCheckStatus.completed
            ? t("syncOnboarding.manual.softwareCheckContent.genuineCheck.completed")
            : t("syncOnboarding.manual.softwareCheckContent.genuineCheck.active")
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
            : firmwareUpdateStatus === Status.updateAvailable
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.updateAvailable", {
                firmwareVersion: "2.0.2", // FIX HERE TO REMOVE HARDCODED VERSION
              })
            : t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.completed")
        }
        subText={
          firmwareUpdateStatus === Status.updateAvailable
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.recommendation")
            : undefined
        }
      />
    </>
  );
};

export default SoftwareCheckContent;
