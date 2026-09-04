import React from "react";
import { DepositOptionsView } from "./DepositOptionsView";
import type { DepositOptionsProps } from "../../types";
import { useDepositOptionsViewModel } from "./useDepositOptionsViewModel";

export function DepositOptions(props: DepositOptionsProps) {
  const { title, options, onSelectOption } = useDepositOptionsViewModel(props);

  return (
    <DepositOptionsView
      isOpen={props.isOpen}
      title={title}
      options={options}
      bottomInset={props.bottomInset}
      onClose={props.onClose}
      onSelectOption={onSelectOption}
    />
  );
}
