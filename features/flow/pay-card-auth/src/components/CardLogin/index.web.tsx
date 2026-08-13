import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInBrowser } from "./openHostedLogin.web";

export function CardLogin() {
  return (
    <CardLoginView
      {...useCardLoginViewModel({
        openHostedLogin: openHostedLoginInBrowser,
      })}
    />
  );
}
