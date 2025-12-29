import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { KNOWN_NEURON_IDS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { Divider } from "@ledgerhq/react-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input, { InputError } from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import { CopiableField } from "../../components/CopialbleField";
import { StepProps } from "../types";
import { FolloweesList } from "./components";

const neuronIdsList = Object.entries(KNOWN_NEURON_IDS);

export function StepSelectFollowees({
  followTopic,
  transitionTo,
  setLastManageAction,
  manageNeuronIndex,
  neurons,
  account,
  onChangeTransaction,
}: StepProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<InputError>(null);
  const [followNeuronId, setFollowNeuronId] = useState<string>("");
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const hasInitialFollowees = neuron.followees.length > 0;

  const [followees, setFollowees] = useState<string[]>(
    Object.entries(neuron.modFollowees)
      .map(([key, value]) => {
        if (value.includes(followTopic)) {
          return key;
        }
        return undefined;
      })
      .filter((item): item is string => item !== undefined),
  );

  const onChangeFollowNeuronId = useCallback(
    (value: string) => {
      setFollowNeuronId(value);
      if (value && /[^0-9]/.test(value)) {
        setError(new Error("Invalid neuron ID, please enter a valid neuron ID"));
      } else if (followees.includes(value)) {
        setError(new Error("Neuron ID already in followees"));
      } else {
        setError(null);
      }
    },
    [setFollowNeuronId, followees],
  );

  const onClickFollowNeuron = useCallback(() => {
    const bridge = getAccountBridge(account);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: "follow",
        followeesIds: followees,
        followTopic,
      }),
    );
    setLastManageAction("follow");
    transitionTo("manageAction");
  }, [
    transitionTo,
    account,
    neuron.id,
    followees,
    followTopic,
    onChangeTransaction,
    setLastManageAction,
  ]);

  const onClickAddFollowee = useCallback(
    (neuronId?: string) => {
      const newFollowees = [...followees];
      if (neuronId?.length) {
        newFollowees.push(neuronId);
      } else if (followNeuronId.length) {
        newFollowees.push(followNeuronId);
      }
      setFollowees(newFollowees);
      setFollowNeuronId("");
    },
    [followNeuronId, followees],
  );

  const onClickRemoveFollowee = useCallback((followee: string) => {
    setFollowees(prev => prev.filter(f => f !== followee));
  }, []);

  return (
    <Box>
      <Box mb={4}>
        <Text ff="Inter|SemiBold" fontSize={16}>
          {t(`internetComputer.manageNeuron.followTopic.${followTopic}.title`)}
        </Text>
      </Box>
      <Box style={{ gap: 5 }}>
        <Label>{t("internetComputer.manageNeuronFlow.selectFollowees.title")}</Label>
        <Box style={{ gap: 5, justifyContent: "flex-end" }}>
          <Input
            value={followNeuronId}
            onChange={onChangeFollowNeuronId}
            error={error}
            placeholder={t("internetComputer.manageNeuronFlow.selectFollowees.placeholder")}
          />
          <Button
            onClick={() => onClickAddFollowee()}
            disabled={!!error}
            style={{ marginLeft: "auto" }}
            primary
          >
            {t("common.add")}
          </Button>
        </Box>
      </Box>
      <Divider my={4} width={"100%"} />
      <Box style={{ gap: 10 }}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          {t("internetComputer.manageNeuronFlow.selectFollowees.options")}
        </Text>
        <Box style={{ gap: 15 }}>
          {neuronIdsList.map(([key, value]) => (
            <Box
              key={value}
              style={{ gap: 10, flexDirection: "row", justifyContent: "space-between" }}
            >
              <Box>
                <Text ff="Inter|SemiBold" fontSize={14}>
                  {value}
                </Text>
                <CopiableField value={key}>
                  <Text ff="Inter|Regular" fontSize={14}>
                    {key}
                  </Text>
                </CopiableField>
              </Box>
              <Button
                onClick={() => onClickAddFollowee(key)}
                disabled={followees.includes(key)}
                style={{ boxShadow: "none" }}
                primary
              >
                {t("common.add")}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
      {(Boolean(followees.length) || hasInitialFollowees) && (
        <FolloweesList
          followees={followees}
          onRemoveFollowee={onClickRemoveFollowee}
          onCancel={() => transitionTo("manage")}
          onSubmit={onClickFollowNeuron}
        />
      )}
    </Box>
  );
}
