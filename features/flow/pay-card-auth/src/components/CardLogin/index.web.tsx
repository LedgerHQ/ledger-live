import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInBrowser } from "./openHostedLogin.web";
import { mobileWallet } from "./mobileWallet.web";
import type { CardLoginProps } from "./types";

export function CardLogin({
  children,
  oauthConfig,
  callback,
  openHostedLogin,
  openHostedPage,
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedLoginInBrowser,
    openHostedPage,
    mobileWallet,
    oauthConfig,
    callback,
  });

  return login ? <CardLoginView {...login}>{children}</CardLoginView> : <>{children}</>;
}
