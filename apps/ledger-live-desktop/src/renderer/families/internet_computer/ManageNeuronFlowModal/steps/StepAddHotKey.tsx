import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import SubmitFooter from "./SubmitFooter";
import type { StepProps } from "../../neuronFlow/types";

/**
 * Grants another principal hot-key access to the neuron: it may vote and set following, but cannot
 * move the stake. The bridge validates the principal, so the field is free text here.
 */
const StepAddHotKey = ({ transaction, onUpdateTransaction }: StepProps) => {
  const onChange = useCallback(
    (hotKeyToAdd: string) => onUpdateTransaction(tx => ({ ...tx, hotKeyToAdd })),
    [onUpdateTransaction],
  );

  return (
    <Box flow={3} px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans i18nKey="internetComputer.manageNeuronFlow.addHotKey.description" />
      </Text>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70" mb={1}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.addHotKey.principal" />
        </Text>
        <Input
          value={transaction?.hotKeyToAdd ?? ""}
          onChange={onChange}
          placeholder="aaaaa-aa"
          data-testid="icp-hot-key-input"
        />
      </Box>
    </Box>
  );
};

export const StepAddHotKeyFooter = (props: StepProps) => (
  <SubmitFooter {...props} canContinue={!!props.transaction?.hotKeyToAdd} />
);

export default StepAddHotKey;
