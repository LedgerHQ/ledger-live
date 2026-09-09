import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInBrowser } from "./openHostedLogin.web";
import { mobileWallet } from "./mobileWallet.web";
import type { CardLoginProps } from "./types";

export function CardLogin({
  oauthConfig,
  callback,
  openHostedLogin,
  onTrackEvent,
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedLoginInBrowser,
    mobileWallet,
    oauthConfig,
    callback,
    onTrackEvent,
  });

  return login ? <CardLoginView {...login} /> : null;
}
