import React, { useMemo } from "react";
import { WebView } from "react-native-webview";
import {
  FTXProviders,
  getFTXURL,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { MFAProps } from "../types";

export function MFA({
  route: {
    params: { provider },
  },
}: MFAProps) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <FTXMFA provider={provider} />;
    default:
      return null;
  }
}

function FTXMFA({ provider }: { provider: FTXProvider }) {
  const uri = useMemo(() => getFTXURL({ type: "kyc", provider }), [provider]);

  return <WebView source={{ uri }} />;
}
