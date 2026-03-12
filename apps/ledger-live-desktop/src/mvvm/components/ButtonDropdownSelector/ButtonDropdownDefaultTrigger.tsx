import React from "react";
import { ChevronUpDown } from "@ledgerhq/lumen-ui-react/symbols";
import type { ButtonDropdownItem } from "./types";

type Props = {
  readonly selectedOption: ButtonDropdownItem;
};

export default function ButtonDropdownDefaultTrigger({ selectedOption }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span>{selectedOption.label}</span>
      <ChevronUpDown />
    </div>
  );
}
