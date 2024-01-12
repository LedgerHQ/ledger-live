import React, { useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { log } from "@ledgerhq/logs";
import TrackPage from "~/renderer/analytics/TrackPage";
import Track from "~/renderer/analytics/Track";
import { getDeviceModel } from "@ledgerhq/devices";
import Box from "~/renderer/components/Box";
import { StepProps } from "../types";
import { BoxedIcon, Button, IconsLegacy } from "@ledgerhq/react-ui";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  color: "palette.text.shade100",
}))``;

const Title = styled(Box).attrs(() => ({
  fontFamily: "Inter",
  fontSize: 6,
  color: "palette.text.shade100",
}))`
  font-weight: 600;
  white-space: pre-wrap;
  text-align: center;
`;

const SubTitle = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 4,
  mt: 3,
  color: "palette.text.shade70",
}))`
  white-space: pre-wrap;
  text-align: center;
`;

const StepConfirmation = ({ deviceModelId, appsToBeReinstalled }: StepProps) => {
  const device = getDeviceModel(deviceModelId);
  const { t } = useTranslation();
  const deviceName = { deviceName: device ? device.productName : "" };

  useEffect(() => () => log("firmware-record-end"), []);

  return (
    <Container data-test-id="firmware-update-done">
      <TrackPage category="Manager" name="FirmwareConfirmation" />
      <BoxedIcon
        Icon={IconsLegacy.CheckAloneMedium}
        iconColor="success.c50"
        size={64}
        iconSize={24}
      />
      <Title mt={9}>
        {appsToBeReinstalled
          ? t("manager.modal.successTitleApps", deviceName)
          : t("manager.modal.successTitle", deviceName)}
      </Title>
      {appsToBeReinstalled ? (
        <SubTitle>{t("manager.modal.successSubtitleApps", deviceName)}</SubTitle>
      ) : null}
      <Box mx={7} />
    </Container>
  );
};

export const StepConfirmFooter = ({
  onDrawerClose,
  appsToBeReinstalled,
  finalStepSuccessButtonLabel,
  finalStepSuccessButtonOnClick,
}: StepProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Track event={"FirmwareUpdatedClose"} onUnmount />
      <Button
        variant="main"
        mt={2}
        onClick={
          finalStepSuccessButtonOnClick
            ? finalStepSuccessButtonOnClick
            : () => onDrawerClose(appsToBeReinstalled)
        }
      >
        {finalStepSuccessButtonLabel
          ? finalStepSuccessButtonLabel
          : appsToBeReinstalled
          ? t("manager.modal.sucessCTAApps")
          : t("manager.modal.SuccessCTANoApps")}
      </Button>
    </>
  );
};

export default StepConfirmation;
