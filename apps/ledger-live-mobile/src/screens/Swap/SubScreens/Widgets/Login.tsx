import React, { useMemo } from "react";
import {
  FTXProviders,
  getFTXURL,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { WebView } from "react-native-webview";
import { LoginProps } from "../types";

export function Login({
  route: {
    params: { provider },
  },
}: LoginProps) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <FTXLogin provider={provider} />;
    default:
      return null;
  }
}

function FTXLogin({ provider }: { provider: FTXProviders }) {
  const uri = useMemo(() => getFTXURL({ type: "login", provider }), [provider]);

  return <WebView source={{ uri }} />;
}
