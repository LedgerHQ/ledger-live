import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInSecureBrowser } from "./openHostedLogin.native";
import type { CardLoginProps } from "./types";

export function CardLogin({ oauth }: CardLoginProps) {
  return (
    <CardLoginView
      {...useCardLoginViewModel({
        openHostedLogin: openHostedLoginInSecureBrowser,
        oauth,
      })}
    />
  );
}
