import React from "react";
import { AddressDisplayedView } from "./AddressDisplayedView";
import { useAddressDisplayedViewModel } from "./useAddressDisplayedViewModel";
import type { AddressDisplayedProps } from "../../types";

/** Shown while the address is on the device Secure Screen, and after confirmation. The host renders it inside the DIE. */
export function AddressDisplayed(props: AddressDisplayedProps) {
  return <AddressDisplayedView {...useAddressDisplayedViewModel(props)} />;
}
