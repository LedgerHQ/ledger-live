import React from "react";
import type { AddressVerifiedProps } from "./AddressVerified.types";
import { AddressVerifiedView } from "./AddressVerifiedView";
import { useAddressVerifiedViewModel } from "./useAddressVerifiedViewModel";

export function AddressVerified(props: AddressVerifiedProps) {
  return <AddressVerifiedView {...useAddressVerifiedViewModel(props)} />;
}
