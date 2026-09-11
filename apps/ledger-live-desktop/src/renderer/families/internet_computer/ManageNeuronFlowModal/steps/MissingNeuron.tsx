import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import type { StepProps } from "../../neuronFlow/types";

type Props = Pick<StepProps, "setSelectedNeuronId" | "transitionTo">;

/**
 * Shown by any step that addresses one neuron, once that neuron leaves the snapshot: a disburse or a
 * refresh both drop one while a step may still be mounted on it, and on mobile the snapshot is read
 * live so the step does not even have to be re-entered. Rendering nothing left the flow on an empty
 * body with no way to read what had happened.
 */
const MissingNeuron = ({ setSelectedNeuronId, transitionTo }: Props) => {
  // Clears the stale id on the way out, so the step cannot be re-entered on a neuron that is gone.
  const backToList = useCallback(() => {
    setSelectedNeuronId(null);
    transitionTo("listNeuron");
  }, [setSelectedNeuronId, transitionTo]);

  return (
    <Box flow={3} px={4} alignItems="center">
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans i18nKey="internetComputer.manageNeuronFlow.manage.missingNeuron" />
      </Text>
      <Button primary onClick={backToList} data-testid="icp-missing-neuron-back-button">
        <Trans i18nKey="internetComputer.manageNeuronFlow.confirmation.backToNeurons" />
      </Button>
    </Box>
  );
};

export default MissingNeuron;
