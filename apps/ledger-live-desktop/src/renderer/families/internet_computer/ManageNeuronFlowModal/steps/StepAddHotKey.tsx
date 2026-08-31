import { useICPPrincipal } from "@ledgerhq/live-common/families/internet_computer/react";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import SubmitFooter from "./SubmitFooter";
import MissingNeuron from "./MissingNeuron";
import type { StepProps } from "../../neuronFlow/types";

/**
 * Grants another principal hot-key access to the neuron: it may vote and set following, but cannot
 * move the stake. The bridge validates the principal, so the field is free text here.
 *
 * The account's own principal is shown because nothing else in the app does, which left the field
 * asking for an identifier the user had no way to see or recognize.
 */
const StepAddHotKey = ({
  account,
  neurons,
  selectedNeuronId,
  setSelectedNeuronId,
  transaction,
  onUpdateTransaction,
  transitionTo,
}: StepProps) => {
  const principal = useICPPrincipal(account);
  // Only its presence matters here: this step reads no field off the neuron.
  const hasNeuron = neurons.some(n => n.id?.toString() === selectedNeuronId);
  const onChange = useCallback(
    (hotKeyToAdd: string) => onUpdateTransaction(tx => ({ ...tx, hotKeyToAdd })),
    [onUpdateTransaction],
  );

  if (!hasNeuron) {
    return <MissingNeuron setSelectedNeuronId={setSelectedNeuronId} transitionTo={transitionTo} />;
  }

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
      {principal ? (
        <Box flow={1}>
          <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70">
            <Trans i18nKey="internetComputer.manageNeuronFlow.addHotKey.ownPrincipal" />
          </Text>
          <Box horizontal alignItems="center" style={{ gap: 8 }}>
            <Text
              ff="Inter|Regular"
              fontSize={3}
              color="neutral.c100"
              style={{ wordBreak: "break-all" }}
              data-testid="icp-own-principal"
            >
              {principal}
            </Text>
            <CopyWithFeedback text={principal} />
          </Box>
          <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
            <Trans i18nKey="internetComputer.manageNeuronFlow.addHotKey.ownPrincipalHint" />
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};

export const StepAddHotKeyFooter = (props: StepProps) => (
  <SubmitFooter
    {...props}
    canContinue={!!props.transaction?.hotKeyToAdd}
    hasInput={!!props.transaction?.hotKeyToAdd}
  />
);

export default StepAddHotKey;
