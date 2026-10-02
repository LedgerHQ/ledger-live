import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedUrlInSecureBrowser } from "./openHostedLogin.native";
import { mobileWallet } from "./mobileWallet.native";
import type { CardLoginProps } from "./types";

export function CardLogin({
  children,
  oauthConfig,
  callback,
  openHostedLogin,
  openHostedPage,
  requestProtection,
  keepLoginPage,
  onCreateAccount,
  onLogIn,
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedUrlInSecureBrowser,
    openHostedPage,
    mobileWallet,
    oauthConfig,
    callback,
    requestProtection,
    keepLoginPage,
    onCreateAccount,
    onLogIn,
  });

  return (
    <>
      {login ? <CardLoginView {...login} /> : null}
      {children}
    </>
  );
}
