import React from "react";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import { ReceiveAddressView } from "./ReceiveAddressView";
import { useReceiveAddressViewModel } from "./useReceiveAddressViewModel";

/** The receive address screen: a dialog on desktop, a screen on mobile. */
export function ReceiveAddress(props: ReceiveAddressProps) {
  return <ReceiveAddressView {...useReceiveAddressViewModel(props)} />;
}
