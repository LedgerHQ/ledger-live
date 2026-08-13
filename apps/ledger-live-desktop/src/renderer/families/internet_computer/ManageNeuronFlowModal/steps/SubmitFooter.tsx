import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import type { StepProps } from "../../neuronFlow/types";

type Props = Pick<StepProps, "status" | "bridgePending" | "onClose" | "transitionTo"> & {
  /** Extra condition beyond the bridge's own validation, for input the bridge cannot see yet. */
  canContinue?: boolean;
};

/**
 * Footer shared by every step that collects input before signing. Continue is gated on the bridge's
 * transaction status, so each step only has to keep the transaction up to date.
 */
const SubmitFooter = ({
  status,
  bridgePending,
  onClose,
  transitionTo,
  canContinue = true,
}: Props) => {
  const errors = Object.values(status.errors);
  const blocking = errors.length > 0;

  return (
    <Box grow>
      {blocking ? <ErrorBanner error={errors[0]} /> : null}
      <Box horizontal justifyContent="flex-end">
        <Button onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          primary
          ml={2}
          disabled={bridgePending || blocking || !canContinue}
          onClick={() => transitionTo("manageAction")}
          data-testid="icp-continue-button"
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </Box>
  );
};

export default SubmitFooter;
