import React from "react";
import Box from "~/renderer/components/Box";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import { Trans } from "react-i18next";

export default function TronAccountSubHeader() {
  return (
    <Box>
      <Alert
        type="warning"
        style={{ marginBottom: "10px" }}
        learnMoreUrl={urls.errors.TronStakingDisable}
      >
        <Trans i18nKey="tron.voting.warnDisableStakingMessage" />
      </Alert>
    </Box>
  );
}
