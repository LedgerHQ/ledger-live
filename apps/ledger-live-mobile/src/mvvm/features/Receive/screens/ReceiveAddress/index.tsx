import React from "react";
import { ReceiveAddressScreenView } from "./ReceiveAddressScreenView";
import { useReceiveAddressScreenViewModel } from "./useReceiveAddressScreenViewModel";

export default function ReceiveAddressScreen() {
  return <ReceiveAddressScreenView {...useReceiveAddressScreenViewModel()} />;
}
