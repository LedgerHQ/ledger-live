import React from "react";
import { useTranslation } from "react-i18next";
import {
  ManageModalElementWithAction,
  ManageModalElement,
  ManageModalSection,
  ManageModalActionElement,
} from "../../../components/ManageModalComponents";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

type HotKeysSectionProps = {
  neuron: ICPNeuron;
  isDeviceControlled: boolean;
  onClickAddHotKey: () => void;
  onClickRemoveHotKey: (hotKey: string) => void;
};

export function HotKeysSection({
  neuron,
  isDeviceControlled,
  onClickAddHotKey,
  onClickRemoveHotKey,
}: HotKeysSectionProps) {
  const { t } = useTranslation();

  return (
    <ManageModalSection title={t("internetComputer.manageNeuronFlow.manage.hotKeys.title")}>
      {neuron.hot_keys.map((val, index) => (
        <ManageModalElementWithAction
          key={index}
          label={val.toString()}
          copiableLabel
          action={[
            {
              label: t("internetComputer.manageNeuronFlow.manage.hotKeys.removeAction"),
              onClick: () => onClickRemoveHotKey(val.toString()),
              hidden: !isDeviceControlled,
              outline: true,
            },
          ]}
        />
      ))}
      {neuron.hot_keys.length === 0 && (
        <ManageModalElement
          label={t("internetComputer.manageNeuronFlow.manage.hotKeys.noHotKeys")}
        />
      )}
      <ManageModalActionElement
        hidden={!isDeviceControlled}
        label={t("internetComputer.manageNeuronFlow.manage.hotKeys.addHotKey")}
        onClick={onClickAddHotKey}
      />
    </ManageModalSection>
  );
}
