import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedUrlInSecureBrowser } from "./openHostedLogin.native";
import { mobileWallet } from "./mobileWallet.native";
import type { CardLoginProps } from "./types";

export function CardLogin({
  oauthConfig,
  callback,
  openHostedLogin,
  openHostedPage,
  onTrackEvent,
  requestProtection,
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedUrlInSecureBrowser,
    openHostedPage,
    mobileWallet,
    oauthConfig,
    callback,
    onTrackEvent,
    requestProtection,
  });

  return login ? <CardLoginView {...login} /> : null;
}
