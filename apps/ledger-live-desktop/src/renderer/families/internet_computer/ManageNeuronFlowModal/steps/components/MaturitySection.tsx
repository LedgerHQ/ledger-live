import React from "react";
import { useTranslation } from "react-i18next";
import { Unit } from "@ledgerhq/types-cryptoassets";
import FormattedVal from "~/renderer/components/FormattedVal";
import {
  ManageModalElementWithAction,
  ManageModalSection,
} from "../../../components/ManageModalComponents";
import {
  canStakeMaturity,
  canSpawnNeuron,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

type MaturitySectionProps = {
  neuron: ICPNeuron;
  isDeviceControlled: boolean;
  unit: Unit;
  onClickStakeMaturity: () => void;
  onClickSpawnNeuron: () => void;
};

export function MaturitySection({
  neuron,
  isDeviceControlled,
  unit,
  onClickStakeMaturity,
  onClickSpawnNeuron,
}: MaturitySectionProps) {
  const { t } = useTranslation();

  const totalMaturity =
    Number(neuron.staked_maturity_e8s_equivalent) + Number(neuron.maturity_e8s_equivalent);

  return (
    <ManageModalSection
      title={t("internetComputer.manageNeuronFlow.manage.maturity.title")}
      description={t("internetComputer.manageNeuronFlow.manage.maturity.description")}
      value={<FormattedVal color="palette.text.shade100" val={totalMaturity} unit={unit} />}
    >
      <ManageModalElementWithAction
        label={t("internetComputer.manageNeuronFlow.manage.maturity.staked")}
        labelTooltip={t("internetComputer.manageNeuronFlow.manage.maturity.stakedTooltip")}
        value={
          <FormattedVal
            color="palette.text.shade100"
            val={Number(neuron.staked_maturity_e8s_equivalent)}
            unit={unit}
          />
        }
      />
      <ManageModalElementWithAction
        label={t("internetComputer.manageNeuronFlow.manage.maturity.available")}
        labelTooltip={t("internetComputer.manageNeuronFlow.manage.maturity.availableTooltip")}
        action={[
          {
            label: t("internetComputer.manageNeuronFlow.manage.maturity.stakeAction"),
            onClick: onClickStakeMaturity,
            hidden: !isDeviceControlled,
            disabled: !canStakeMaturity(neuron),
            outline: canStakeMaturity(neuron),
          },
          {
            label: t("internetComputer.manageNeuronFlow.manage.maturity.spawnNeuronAction"),
            onClick: onClickSpawnNeuron,
            hidden: !isDeviceControlled,
            disabled: !canSpawnNeuron(neuron),
            outline: canSpawnNeuron(neuron),
          },
        ]}
        value={
          <FormattedVal
            color="palette.text.shade100"
            val={Number(neuron.maturity_e8s_equivalent)}
            unit={unit}
          />
        }
      />
    </ManageModalSection>
  );
}
