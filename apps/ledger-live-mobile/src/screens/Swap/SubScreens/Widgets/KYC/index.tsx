import React from "react";
import { KYCProps } from "../../../types";
import { Widget } from "../Widget";
import { WyreKYC } from "./Wyre";

export function KYC({
  route: {
    params: { provider },
  },
}: KYCProps) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <Widget provider={provider} type="kyc" />;
    case "wyre":
      return <WyreKYC />;
    default:
      return null;
  }
}
