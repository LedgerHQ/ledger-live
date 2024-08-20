import React, { useCallback, useState } from "react";
import { KNOWN_NEURON_IDS } from "@ledgerhq/live-common/families/internet_computer/consts";
import Input, { InputError } from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import { Divider } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import Cross from "~/renderer/icons/Cross";
import { CopiableField } from "../../components/CopialbleField";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

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

  const [followees, setFollowees] = useState<string[]>([
    ...(Object.entries(neuron.modFollowees)
      .map(([key, value]) => {
        if (value.includes(followTopic)) {
          return key;
        } else {
          return undefined;
        }
      })
      .filter(Boolean) as string[]),
  ]);

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
    const bridge = getAccountBridge(account, undefined);
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
          {Object.entries(KNOWN_NEURON_IDS).map(([key, value]) => (
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
      {(!!followees.length || hasInitialFollowees) && (
        <>
          <Divider my={4} />
          <Box style={{ gap: 10 }}>
            <Text ff="Inter|SemiBold" fontSize={14}>
              {t("internetComputer.common.followees")} ({followees.length})
            </Text>
            <Box style={{ gap: 10 }}>
              {followees.map(followee => (
                <Box style={{ gap: 10, flexDirection: "row" }} key={followee}>
                  <Text ff="Inter|Regular" fontSize={14}>
                    {KNOWN_NEURON_IDS[followee] ?? followee}
                  </Text>
                  <Box
                    style={{ cursor: "pointer", margin: "auto 0" }}
                    onClick={() => onClickRemoveFollowee(followee)}
                  >
                    <Cross size={12} />
                  </Box>
                </Box>
              ))}
            </Box>
            <Box horizontal justifyContent="flex-end">
              <Button mr={2} onClick={() => transitionTo("manage")}>
                {t("common.cancel")}
              </Button>
              {followees.length ? (
                <Button onClick={onClickFollowNeuron} primary>
                  {t("common.follow")}
                </Button>
              ) : (
                <Button onClick={onClickFollowNeuron} primary>
                  {t("common.set")}
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
