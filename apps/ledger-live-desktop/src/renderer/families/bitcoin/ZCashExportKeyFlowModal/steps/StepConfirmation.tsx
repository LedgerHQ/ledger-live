import React from "react";
import { Trans } from "react-i18next";
import { Text, Alert } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";
import { Container } from "../shared/Container";
import type { StepProps } from "../types";

// Placeholder support article; content owners plan to swap this for a dedicated one later.
const UFVK_LEARN_MORE_URL = "https://support.ledger.com/article/115005177269-zd";

function StepConfirmation({ t }: Readonly<StepProps>) {
  return (
    <Container>
      <TrackPage
        category="Export ZCash key"
        name="Step Confirmation Success"
        flow="exportUfvk"
        currency="zcash"
      />
      <SuccessDisplay
        title={<Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.title" />}
        description={multiline(t("zcash.shielded.flows.export.steps.confirmation.success.text"))}
      />
      <div style={{ marginBottom: 12, marginTop: 12 }}>
        <Alert
          type={"info"}
          containerProps={{ p: 12, borderRadius: 8 }}
          renderContent={() => (
            <Text
              variant="paragraphLineHeight"
              fontWeight="semiBold"
              color="neutral.c100"
              fontSize={13}
            >
              <Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.info.text" />{" "}
              <LinkWithExternalIcon
                label={
                  <Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.info.cta" />
                }
                onClick={() => openURL(UFVK_LEARN_MORE_URL)}
              />
            </Text>
          )}
        />
      </div>
      <Alert
        type={"warning"}
        containerProps={{ p: 12, borderRadius: 8 }}
        renderContent={() => (
          <Text
            variant="paragraphLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={13}
          >
            <Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.warning" />
          </Text>
        )}
      />
    </Container>
  );
}

export function StepConfirmationFooter({
  closeModal,
  handleEnableShieldedBalance,
}: Readonly<StepProps>) {
  const handleCloseModal = () => {
    handleEnableShieldedBalance({ startSyncNow: false });
    closeModal();
  };

  const handleStartSync = () => {
    handleEnableShieldedBalance({ startSyncNow: true });
    closeModal();
  };

  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={handleCloseModal}>
        <Trans i18nKey="common.close" />
      </Button>
      <Button id="export-key-start-sync-button" primary onClick={handleStartSync}>
        <Trans i18nKey="zcash.shielded.state.startSync" />
      </Button>
    </Box>
  );
}

export default StepConfirmation;
