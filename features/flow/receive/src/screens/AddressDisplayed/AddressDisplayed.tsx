import React from "react";
import { AddressDisplayedView } from "./AddressDisplayedView";
import { useAddressDisplayedViewModel } from "./useAddressDisplayedViewModel";

export function AddressDisplayed() {
  return <AddressDisplayedView {...useAddressDisplayedViewModel()} />;
}
