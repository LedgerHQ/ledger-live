// @flow
import React from "react";
import Select from "react-select";
import { getAllDerivationModes } from "@ledgerhq/coin-framework/derivation";
import type { DerivationMode } from "@ledgerhq/coin-framework/derivation";

export type DataTypeDerivationMode = {
  type: "derivationMode",
  default?: DerivationMode,
};

type Props = {
  value: ?DerivationMode,
  onChange: (?DerivationMode) => void,
};

const DerivationModeField = ({ value, onChange }: Props) => {
  const derivationModes: DerivationMode[] = getAllDerivationModes();
  const options = derivationModes.map((value) => ({
    label: value || "(default)",
    value,
  }));
  const option = options.find((o) => o.value === value);
  return (
    <Select
      value={option}
      options={options}
      onChange={(o) => {
        console.log(o);
        onChange((o && o.value) || "");
      }}
      placeholder="Select a derivationMode"
    />
  );
};

export default DerivationModeField;
