import React from "react";
import type { AddressMismatchProps } from "./AddressMismatch.types";
import { AddressMismatchView } from "./AddressMismatchView";
import { useAddressMismatchViewModel } from "./useAddressMismatchViewModel";

export function AddressMismatch(props: AddressMismatchProps) {
  return <AddressMismatchView {...useAddressMismatchViewModel(props)} />;
}
