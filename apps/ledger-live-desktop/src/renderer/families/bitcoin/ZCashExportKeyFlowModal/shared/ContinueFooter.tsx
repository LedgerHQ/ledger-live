import React, { useCallback } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import type { StepProps } from "../types";

export function ContinueFooter({ account, transitionTo, stepId }: Readonly<StepProps>) {
  invariant(account, "account required");

  const nextStep = useCallback(() => {
    switch (stepId) {
      case "birthday":
        return "ufvk";
      case "ufvk":
        return "device";
      case "device":
        return "confirmation";
      default:
        return stepId;
    }
  }, [stepId]);

  return (
    <Box horizontal>
      <Button id="export-key-continue-button" primary onClick={() => transitionTo(nextStep())}>
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
