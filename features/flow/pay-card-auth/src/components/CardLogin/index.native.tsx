import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInSecureBrowser } from "./openHostedLogin.native";
import type { CardLoginProps } from "./types";

export function CardLogin({ oauthConfig, callback }: CardLoginProps) {
  return (
    <CardLoginView
      {...useCardLoginViewModel({
        openHostedLogin: openHostedLoginInSecureBrowser,
        oauthConfig,
        callback,
      })}
    />
  );
}
