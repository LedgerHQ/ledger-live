import React from "react";
import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import WarnBox from "~/renderer/components/WarnBox";
import {
  ManageModalElement,
  ManageModalSection,
  ManageModalActionElement,
} from "../../../components/ManageModalComponents";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import {
  KNOWN_TOPICS,
  KNOWN_NEURON_IDS,
} from "@ledgerhq/live-common/families/internet_computer/consts";

type FollowingSectionProps = {
  neuron: ICPNeuron;
  onClickFollow: () => void;
};

export function FollowingSection({ neuron, onClickFollow }: FollowingSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      {neuron.followees.length === 0 && (
        <WarnBox>
          <Trans i18nKey="internetComputer.manageNeuronFlow.manage.following.warnbox" />
        </WarnBox>
      )}
      <ManageModalSection
        title={t("internetComputer.manageNeuronFlow.manage.following.title")}
        titleTooltip={t("internetComputer.manageNeuronFlow.manage.following.description")}
      >
        {Object.entries(neuron.modFollowees).map(([neuronId, topics]) => (
          <ManageModalElement
            key={`followees-${neuronId}`}
            value={`${topics
              .map(topic =>
                KNOWN_TOPICS[topic]
                  ? t(`internetComputer.manageNeuron.followTopic.${topic}.title`)
                  : topic,
              )
              .join(", ")}`}
            copiableLabel
            label={KNOWN_NEURON_IDS[neuronId] ?? neuronId}
          />
        ))}
        <ManageModalActionElement
          label={t("internetComputer.manageNeuronFlow.manage.following.followNeuronsAction")}
          onClick={onClickFollow}
        />
      </ManageModalSection>
    </>
  );
}
