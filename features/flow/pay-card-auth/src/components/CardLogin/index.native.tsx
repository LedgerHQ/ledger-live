import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { CardLoginView } from "./CardLoginView";
import { useCardLoginViewModel } from "./useCardLoginViewModel";
import { openHostedUrlInSecureBrowser } from "./openHostedLogin.native";
import { mobileWallet } from "./mobileWallet.native";
import type { CardLoginProps } from "./types";

const CARD_ASPECT_RATIO = 343 / 193;

export function CardLogin({
  children,
  oauthConfig,
  callback,
  openHostedLogin,
  openHostedPage,
  requestProtection,
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedUrlInSecureBrowser,
    openHostedPage,
    mobileWallet,
    oauthConfig,
    callback,
    requestProtection,
  });

  return (
    <>
      {login ? <CardLoginView {...login} /> : null}
      {login?.isResolving ? <CardArtworkSkeleton /> : children}
    </>
  );
}

function CardArtworkSkeleton() {
  return (
    <Skeleton
      lx={{ width: "full", borderRadius: "lg" }}
      style={{ aspectRatio: CARD_ASPECT_RATIO }}
      testID="card-artwork-skeleton"
    />
  );
}
