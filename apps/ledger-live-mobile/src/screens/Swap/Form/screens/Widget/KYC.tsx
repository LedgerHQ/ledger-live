import React, { useMemo } from "react";
import {
  FTXProviders,
  getFTXURL,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { WebView } from "react-native-webview";
import { KYCProps } from "../types";

export function KYC({
  route: {
    params: { provider },
  },
}: KYCProps) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <FTXKYC provider={provider} />;
    case "wyre":
      return <WyreKYC />;
    default:
      return null;
  }
}

function FTXKYC({ provider }: { provider: FTXProviders }) {
  const uri = useMemo(() => getFTXURL({ type: "kyc", provider }), [provider]);

  return <WebView source={{ uri }} />;
}

function WyreKYC() {
  return null;
}
