import React from "react";
import type { AddressDisplayedProps } from "./AddressDisplayed.types";
import { AddressDisplayedView } from "./AddressDisplayedView";
import { useAddressDisplayedViewModel } from "./useAddressDisplayedViewModel";

export function AddressDisplayed(props: AddressDisplayedProps) {
  return <AddressDisplayedView {...useAddressDisplayedViewModel(props)} />;
}
