import React from "react";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { ENTRY_POINTS } from "./constants";
import { EntryPointOption } from "./types";
import { VerticalLabeledSelect } from "./VerticalLabeledSelect";
import { LabeledSwitch } from "./LabeledSwitch";

interface DevToolControlsProps {
  entryPoint: EntryPointOption;
  setEntryPoint: (entryPoint: EntryPointOption) => void;
  includeTokens: boolean;
  setIncludeTokens: (includeTokens: boolean) => void;
  openModal: boolean;
  setOpenModal: (openModal: boolean) => void;
}

export const DevToolControls: React.FC<DevToolControlsProps> = ({
  entryPoint,
  setEntryPoint,
  includeTokens,
  setIncludeTokens,
  openModal,
  setOpenModal,
}) => {
  return (
    <>
      <VerticalLabeledSelect
        label="Entry Point"
        value={entryPoint}
        options={ENTRY_POINTS}
        onChange={setEntryPoint}
      />
      <LabeledSwitch label="Include Tokens" isChecked={includeTokens} onChange={setIncludeTokens} />
      {entryPoint.value === ModularDrawerLocation.ADD_ACCOUNT && (
        <LabeledSwitch
          label="Open Receive modal after adding an account?"
          isChecked={openModal}
          onChange={setOpenModal}
        />
      )}
    </>
  );
};
