import React from "react";
import { KYCParamList } from "../../../types";
import { Widget } from "../Widget";
import { WyreKYC } from "./Wyre";

export { StateSelect } from "./StateSelect";

export function KYC({
  route: {
    params: { provider },
  },
}: KYCParamList) {
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
