import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInBrowser } from "./openHostedLogin.web";
import type { CardLoginProps } from "./types";

export function CardLogin({ oauth }: CardLoginProps) {
  return (
    <CardLoginView
      {...useCardLoginViewModel({
        openHostedLogin: openHostedLoginInBrowser,
        oauth,
      })}
    />
  );
}
