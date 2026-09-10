import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { cannotSign, reportableObjection } from "../../neuronFlow/submitGate";
import type { StepProps } from "../../neuronFlow/types";

type Props = Pick<
  StepProps,
  "status" | "bridgePending" | "onClose" | "transitionTo" | "neurons" | "selectedNeuronId"
> & {
  /** Extra condition beyond the bridge's own validation, for input the bridge cannot see yet. */
  canContinue?: boolean;
  /**
   * Whether the user has entered anything yet. The bridge validates an empty field as invalid, so
   * without this every input step opens with a red banner before the user has typed a character.
   * Kept separate from `canContinue`: an entry that is present but out of range must still explain
   * itself, and that is exactly the case where the two differ.
   */
  hasInput?: boolean;
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
  neurons,
  selectedNeuronId,
  canContinue = true,
  hasInput = true,
}: Props) => {
  // The step body explains the state; withholding Continue here is what stops the signature. The
  // rule lives in submitGate so the device step cannot come to a different conclusion about the same
  // transaction, and so a step added later cannot forget it.
  const objection = reportableObjection({ status, bridgePending });

  return (
    <Box grow>
      {objection && hasInput ? <ErrorBanner error={objection} /> : null}
      <Box horizontal justifyContent="flex-end">
        <Button onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          primary
          ml={2}
          disabled={
            bridgePending || !canContinue || cannotSign({ status, neurons, selectedNeuronId })
          }
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
