import React from "react";
import { useTranslation } from "react-i18next";
import {
  ManageModalElement,
  ManageModalSection,
  ManageModalActionElement,
} from "../../../components/ManageModalComponents";
import { canSplitNeuron } from "@ledgerhq/live-common/families/internet_computer/utils";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

type AdvancedDetailsSectionProps = {
  neuron: ICPNeuron;
  neuronId: string;
  isDeviceControlled: boolean;
  onClickSplitNeuron: () => void;
  onClickAutoStakeMaturity: (enabled: boolean) => void;
};

export function AdvancedDetailsSection({
  neuron,
  neuronId,
  isDeviceControlled,
  onClickSplitNeuron,
  onClickAutoStakeMaturity,
}: AdvancedDetailsSectionProps) {
  const { t } = useTranslation();

  const createdDate = new Date(Number(neuron.created_timestamp_seconds) * 1000).toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  const dissolveDate = new Date(Number(neuron.whenDissolvedTimestampSeconds) * 1000).toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  return (
    <ManageModalSection title={t("internetComputer.manageNeuronFlow.manage.advancedDetails.title")}>
      <ManageModalElement
        label={t("internetComputer.common.neuronId")}
        copiableValue
        value={neuronId}
      />
      <ManageModalElement
        label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.dateCreated")}
        value={createdDate}
      />
      <ManageModalElement
        label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.dissolveDate")}
        value={dissolveDate}
      />
      <ManageModalElement
        label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.neuronAccount")}
        value={neuron.accountIdentifier}
        copiableValue
        ellipsis
      />

      <ManageModalActionElement
        hidden={!isDeviceControlled}
        disabled={!canSplitNeuron(neuron)}
        label={t("internetComputer.manageNeuronFlow.manage.advancedDetails.splitNeuronAction")}
        onClick={onClickSplitNeuron}
      />

      <ManageModalActionElement
        label={`${neuron.auto_stake_maturity[0] ? t("common.stop") : t("common.start")} ${t("internetComputer.manageNeuronFlow.manage.advancedDetails.autoStakeMaturityAction")}`}
        onClick={() => onClickAutoStakeMaturity(!neuron.auto_stake_maturity[0])}
        hidden={!isDeviceControlled}
      />
    </ManageModalSection>
  );
}
