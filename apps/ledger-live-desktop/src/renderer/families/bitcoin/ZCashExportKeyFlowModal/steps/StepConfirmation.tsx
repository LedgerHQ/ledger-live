import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { multiline } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import type { StepProps } from "../types";
import { Text, Alert } from "@ledgerhq/react-ui";
import { Container } from "../shared/Container";

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
              <Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.info.text" />
              <b>
                {" "}
                <Trans i18nKey="zcash.shielded.flows.export.steps.confirmation.success.info.cta" />
              </b>
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

export function StepConfirmationFooter({ closeModal }: Readonly<StepProps>) {
  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={closeModal}>
        <Trans i18nKey="common.close" />
      </Button>
      <Button id="export-key-start-sync-button" primary onClick={closeModal}>
        <Trans i18nKey="zcash.shielded.startSync" />
      </Button>
    </Box>
  );
}

export default StepConfirmation;
