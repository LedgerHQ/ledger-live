import React from "react";
import { SponsoredRentSignatureView } from "./components/SponsoredRentSignatureView";
import { useSponsoredRentSignatureViewModel } from "./hooks/useSponsoredRentSignatureViewModel";

export function SponsoredRentSignatureScreen() {
  return <SponsoredRentSignatureView {...useSponsoredRentSignatureViewModel()} />;
}
