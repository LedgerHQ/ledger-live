import React from "react";
import { ReceiveAddressView } from "./ReceiveAddressView";
import { useReceiveAddressViewModel } from "./useReceiveAddressViewModel";
import type { ReceiveAddressProps } from "../../types";

export function ReceiveAddress(props: ReceiveAddressProps) {
  return <ReceiveAddressView {...useReceiveAddressViewModel(props)} />;
}
