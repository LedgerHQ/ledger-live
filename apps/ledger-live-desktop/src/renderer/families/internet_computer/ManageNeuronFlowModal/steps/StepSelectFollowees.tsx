import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import { NeuronDetailRow } from "../../components/NeuronDetails";
import SubmitFooter from "./SubmitFooter";
import type { StepProps } from "../../neuronFlow/types";

const EMPTY_FOLLOWEES: string[] = [];

/**
 * Edits the followee list for one topic. The canister replaces the whole list per `follow` call, so
 * removing a followee means submitting the remaining ones — there is no per-followee delete call.
 */
const StepSelectFollowees = ({
  neurons,
  selectedNeuronId,
  followTopic,
  transaction,
  onUpdateTransaction,
}: StepProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);
  // Stable across renders: the `?? []` fallback would otherwise be a fresh array every time, which
  // invalidates every callback below.
  const followeesIds = useMemo(
    () => transaction?.followeesIds ?? EMPTY_FOLLOWEES,
    [transaction?.followeesIds],
  );

  // Seed the transaction from the neuron's current followees for this topic, so submitting an
  // untouched list is a no-op rather than a wipe.
  useEffect(() => {
    if (!followTopic || transaction?.followeesIds) return;
    const current = neuron?.followees.find(f => f.topic === KNOWN_TOPICS[followTopic]);
    onUpdateTransaction(tx => ({
      ...tx,
      followTopic,
      followeesIds: current?.followeeIds.map(id => id.toString()) ?? [],
    }));
  }, [followTopic, neuron, onUpdateTransaction, transaction?.followeesIds]);

  const setFollowees = useCallback(
    (next: string[]) => onUpdateTransaction(tx => ({ ...tx, followeesIds: next })),
    [onUpdateTransaction],
  );

  const onAdd = useCallback(() => {
    const id = draft.replace(/\D/g, "");
    if (!id || followeesIds.includes(id)) return;
    setFollowees([...followeesIds, id]);
    setDraft("");
  }, [draft, followeesIds, setFollowees]);

  if (!followTopic) return null;

  return (
    <Box flow={3} px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans
          i18nKey="internetComputer.manageNeuronFlow.selectFollowees.description"
          values={{ topic: followTopic }}
        />
      </Text>
      <Box horizontal style={{ gap: 8 }} alignItems="flex-end">
        <Box grow>
          <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70" mb={1}>
            <Trans i18nKey="internetComputer.manageNeuronFlow.selectFollowees.neuronId" />
          </Text>
          <Input value={draft} onChange={setDraft} data-testid="icp-followee-input" />
        </Box>
        <Button primary onClick={onAdd} disabled={!draft} data-testid="icp-followee-add-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.selectFollowees.add" />
        </Button>
      </Box>
      {followeesIds.length === 0 ? (
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
          <Trans i18nKey="internetComputer.manageNeuronFlow.selectFollowees.empty" />
        </Text>
      ) : (
        followeesIds.map(id => (
          <NeuronDetailRow
            key={id}
            label={id}
            actions={[
              {
                label: t("internetComputer.manageNeuronFlow.selectFollowees.remove"),
                onClick: () => setFollowees(followeesIds.filter(other => other !== id)),
              },
            ]}
          />
        ))
      )}
    </Box>
  );
};

export const StepSelectFolloweesFooter = (props: StepProps) => (
  <SubmitFooter {...props} canContinue={!!props.transaction?.followTopic} />
);

export default StepSelectFollowees;
