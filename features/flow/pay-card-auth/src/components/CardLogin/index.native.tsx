import React from "react";
import { CardLoginView } from "./CardLoginView";
import { CardUserView } from "./CardUserView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInSecureBrowser } from "./openHostedLogin.native";
import type { CardLoginProps } from "./types";

export function CardLogin({ oauthConfig, callback }: CardLoginProps) {
  const { login, user } = useCardLoginViewModel({
    openHostedLogin: openHostedLoginInSecureBrowser,
    oauthConfig,
    callback,
  });

  if (user) {
    return <CardUserView {...user} />;
  }

  return login ? <CardLoginView {...login} /> : null;
}
