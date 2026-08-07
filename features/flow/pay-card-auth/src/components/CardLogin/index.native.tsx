import React from "react";
import { CardLoginView } from "./CardLoginView";
import type { CardLoginProps } from "./types";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedLoginInSecureBrowser } from "./openHostedLogin";

export function CardLogin(props: CardLoginProps) {
  return (
    <CardLoginView
      {...useCardLoginViewModel({
        ...props,
        openHostedLogin: openHostedLoginInSecureBrowser,
      })}
    />
  );
}

export type { CardLoginProps, OpenHostedLogin } from "./types";
