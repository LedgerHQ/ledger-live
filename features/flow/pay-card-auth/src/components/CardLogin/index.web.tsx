import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
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
}: CardLoginProps) {
  const login = useCardLoginViewModel({
    openHostedLogin: openHostedLogin ?? openHostedLoginInBrowser,
    openHostedPage,
    mobileWallet,
    oauthConfig,
    callback,
  });

  return (
    <>
      {login?.isResolving ? <CardArtworkSkeleton /> : children}
      {login ? <CardLoginView {...login} /> : null}
    </>
  );
}

function CardArtworkSkeleton() {
  return <Skeleton className="h-[195px] w-full rounded-lg" data-testid="card-artwork-skeleton" />;
}
