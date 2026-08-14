import React from "react";
import { CardLoginView } from "./CardLoginView";
import { CardUserView } from "./CardUserView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInBrowser } from "./openHostedLogin.web";
import type { CardLoginProps } from "./types";

export function CardLogin({ oauthConfig, callback }: CardLoginProps) {
  const { login, user } = useCardLoginViewModel({
    openHostedLogin: openHostedLoginInBrowser,
    oauthConfig,
    callback,
  });

  if (user) {
    return <CardUserView {...user} />;
  }

  return login ? <CardLoginView {...login} /> : null;
}
