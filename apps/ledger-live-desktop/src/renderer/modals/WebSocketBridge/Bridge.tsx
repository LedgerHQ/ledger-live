import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";
import InfoDisplay from "~/renderer/components/InfoDisplay";
const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: center;
  min-height: 220px;
`;
const Bridge = ({
  origin,
  appName,
  onClose,
}: {
  origin: string | undefined | null;
  appName: string | undefined | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <ModalBody
      onClose={onClose}
      title={t("bridge.modalTitle")}
      render={() => (
        <Box relative px={5}>
          <TrackPage category="Modal" name="Bridge Sunset" origin={origin} appName={appName} />
          <Container>
            <InfoDisplay title={t("bridge.openHeader")} description={t("bridge.openDescription")} />
          </Container>
        </Box>
      )}
      renderFooter={() => (
        <Box horizontal justifyContent="flex-end">
          <Button onClick={onClose} primary>
            {t("bridge.closeButton")}
          </Button>
        </Box>
      )}
    />
  );
};
export default Bridge;
