import React from "react";
import { DepositOptionsView } from "./DepositOptionsView";
import type { DepositOptionsProps } from "../../types";
import { useDepositOptionsViewModel } from "./useDepositOptionsViewModel";

export function DepositOptions(props: DepositOptionsProps) {
  const { options, onSelectOption } = useDepositOptionsViewModel(props);

  return (
    <DepositOptionsView
      isOpen={props.isOpen}
      title={props.labels.title}
      options={options}
      onClose={props.onClose}
      onSelectOption={onSelectOption}
    />
  );
}
