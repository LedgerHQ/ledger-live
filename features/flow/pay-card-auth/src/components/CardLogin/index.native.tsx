import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInSecureBrowser } from "./openHostedLogin.native";
import { mobileWallet } from "./mobileWallet.native";
import type { CardLoginProps } from "./types";

export function CardLogin({ oauthConfig, callback }: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLoginInSecureBrowser,
    mobileWallet,
    oauthConfig,
    callback,
  });

  return login ? <CardLoginView {...login} /> : null;
}
