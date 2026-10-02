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
  keepLoginPage,
  onCreateAccount,
  onLogIn,
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedLoginInBrowser,
    openHostedPage,
    mobileWallet,
    oauthConfig,
    callback,
    keepLoginPage,
    onCreateAccount,
    onLogIn,
  });

  return (
    <>
      {children}
      {login ? <CardLoginView {...login} /> : null}
    </>
  );
}
