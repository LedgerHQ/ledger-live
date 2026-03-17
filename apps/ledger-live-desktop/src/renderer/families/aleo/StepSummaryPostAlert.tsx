import React from "react";
import { Trans } from "react-i18next";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import type { AleoFamily } from "./types";

const StepSummaryPostAlert: NonNullable<AleoFamily["StepSummaryPostAlert"]> = () => {
  const learnMoreUrl = useLocalizedUrl(urls.aleo.learnMore);

  return (
    <Box mt={16}>
      <Alert
        data-testid="aleo-proof-generation-warning"
        type="secondary"
        learnMoreUrl={learnMoreUrl}
      >
        <Trans i18nKey="aleo.send.summary.proofGenerationWarning" />
      </Alert>
    </Box>
  );
};

export default StepSummaryPostAlert;
