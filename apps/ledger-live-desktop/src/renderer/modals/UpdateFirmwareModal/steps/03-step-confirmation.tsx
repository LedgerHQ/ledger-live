import React, { useCallback, useContext, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { log } from "@ledgerhq/logs";
import { UserRefusedFirmwareUpdate } from "@ledgerhq/errors";
import { useHistory } from "react-router-dom";
import TrackPage from "~/renderer/analytics/TrackPage";
import Track from "~/renderer/analytics/Track";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { StepProps } from "../";
import { context } from "~/renderer/drawers/Provider";
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
  font-weight: 500;
`;

const StepConfirmation = ({
  error,
  appsToBeReinstalled,
  finalStepSuccessDescription,
}: StepProps) => {
  const { t } = useTranslation();

  useEffect(() => () => log("firmware-record-end"), []);

  if (error) {
    const isUserRefusedFirmwareUpdate = error instanceof UserRefusedFirmwareUpdate;
    return (
      <ErrorDisplay
        error={error}
        warning={isUserRefusedFirmwareUpdate}
        withExportLogs={!isUserRefusedFirmwareUpdate}
      />
    );
  }

  return (
    <Container data-test-id="firmware-update-done">
      <TrackPage category="Manager" name="FirmwareConfirmation" />
      <BoxedIcon
        Icon={IconsLegacy.CheckAloneMedium}
        iconColor="success.c50"
        size={64}
        iconSize={24}
      />
      <Title mt={9}>{t("manager.modal.successTitle")}</Title>
      <Box mt={2} mb={5}>
        <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade80" textAlign="center">
          {finalStepSuccessDescription
            ? finalStepSuccessDescription
            : appsToBeReinstalled
            ? t("manager.modal.successTextApps")
            : t("manager.modal.successTextNoApps")}
        </Text>
      </Box>
      <Box mx={7} />
    </Container>
  );
};

export const StepConfirmFooter = ({
  onDrawerClose,
  error,
  appsToBeReinstalled,
  onRetry,
  finalStepSuccessButtonLabel,
  finalStepSuccessButtonOnClick,
  shouldReloadManagerOnCloseIfUpdateRefused,
}: StepProps) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { setDrawer } = useContext(context);

  const onCloseReload = useCallback(() => {
    onDrawerClose();
    if (error instanceof UserRefusedFirmwareUpdate && shouldReloadManagerOnCloseIfUpdateRefused) {
      history.push("/manager/reload");
      setDrawer();
    }
  }, [error, history, onDrawerClose, setDrawer, shouldReloadManagerOnCloseIfUpdateRefused]);

  if (error) {
    const isUserRefusedFirmwareUpdate = error instanceof UserRefusedFirmwareUpdate;
    return (
      <>
        <Button variant={!isUserRefusedFirmwareUpdate ? "main" : undefined} onClick={onCloseReload}>
          {t("common.close")}
        </Button>
        {isUserRefusedFirmwareUpdate ? (
          <Button variant="main" ml={4} onClick={() => onRetry()}>
            {t("manager.modal.cancelReinstallCTA")}
          </Button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Track event={"FirmwareUpdatedClose"} onUnmount />
      <Button
        variant="main"
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
