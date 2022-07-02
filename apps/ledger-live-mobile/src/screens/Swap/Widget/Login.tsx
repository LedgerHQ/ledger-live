import React, { useMemo } from "react";
import { getFTXURL } from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { WebView } from "react-native-webview";
import { LoginProps } from "../types";

export function Login({
  route: {
    params: { provider },
  },
}: LoginProps) {
  const uri = useMemo(() => getFTXURL({ type: "login", provider }), [provider]);

  return <WebView source={{ uri }} />;
}
