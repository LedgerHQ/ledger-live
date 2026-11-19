import React from "react";
import { WarningFill } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import { addressMismatchInfoState } from "./addressMismatchInfoState";
import type { AddressMismatchViewProps } from "./AddressMismatchView.types";

export function AddressMismatchView(props: AddressMismatchViewProps) {
  return <InfoState {...addressMismatchInfoState(props, WarningFill)} />;
}
