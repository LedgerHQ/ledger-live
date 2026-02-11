import React from "react";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { LOCATIONS, LIVE_APPS } from "./constants";
import { LocationOption, LiveAppOption } from "./types";
import { VerticalLabeledSelect } from "./VerticalLabeledSelect";
import { LabeledSwitch } from "./LabeledSwitch";

interface DevToolControlsProps {
  location: LocationOption;
  setLocation: (location: LocationOption) => void;
  liveApp: LiveAppOption;
  setLiveApp: (liveApp: LiveAppOption) => void;
  openModal: boolean;
  setOpenModal: (openModal: boolean) => void;
}

export const DevToolControls: React.FC<DevToolControlsProps> = ({
  location,
  setLocation,
  liveApp,
  setLiveApp,
  openModal,
  setOpenModal,
}) => {
  return (
    <>
      <VerticalLabeledSelect
        label="Entry Point"
        value={location}
        options={LOCATIONS}
        onChange={setLocation}
      />

      {location.value === ModularDrawerLocation.ADD_ACCOUNT && (
        <LabeledSwitch
          label="Open Receive modal after adding an account?"
          isChecked={openModal}
          onChange={setOpenModal}
        />
      )}
      {location.value === ModularDrawerLocation.LIVE_APP && (
        <VerticalLabeledSelect
          label="Live App"
          value={liveApp}
          options={LIVE_APPS}
          onChange={setLiveApp}
        />
      )}
    </>
  );
};
