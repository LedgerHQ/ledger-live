import React from "react";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInSecureBrowser } from "./openHostedLogin.native";

export function CardLogin() {
  return (
    <CardLoginView
      {...useCardLoginViewModel({
        openHostedLogin: openHostedLoginInSecureBrowser,
      })}
    />
  );
}
