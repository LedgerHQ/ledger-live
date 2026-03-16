import React from "react";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box/Box";
import type { AleoFamily } from "./types";

const StepSummaryPostAlert: NonNullable<AleoFamily["StepSummaryPostAlert"]> = () => {
  const learnMoreUrl = useLocalizedUrl(urls.aleo.learnMore);

  return (
    <Box mt={15}>
      <Alert
        data-testid="aleo-proof-generation-warning"
        type="warning"
        small
        learnMoreUrl={learnMoreUrl}
      >
        <Trans i18nKey="aleo.send.summary.proofGenerationWarning" />
      </Alert>
    </Box>
  );
};

export default StepSummaryPostAlert;
