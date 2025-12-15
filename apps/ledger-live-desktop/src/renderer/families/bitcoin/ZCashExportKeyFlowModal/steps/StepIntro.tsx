import React from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { Text, Alert } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import type { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

function StepIntro({ t, account }: Readonly<StepProps>) {
  invariant(account, "account required");

  return (
    <Container>
      <TrackPage
        category="Export ZCash key"
        name="Step export"
        flow="exportUfvk"
        action="export"
        currency="zcash"
      />
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
            <Trans i18nKey="zcash.shielded.flows.export.steps.intro.text" />
          </Text>
        )}
      />
    </Container>
  );
}

export function StepExportFooter({ account, transitionTo, onClose }: Readonly<StepProps>) {
  invariant(account, "account required");

  return (
    <Box horizontal>
      <Button mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button id="export-key-continue-button" primary onClick={() => transitionTo("device")}>
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

export default StepIntro;
