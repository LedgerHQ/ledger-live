import React from "react";
import { Button, Skeleton } from "@ledgerhq/lumen-ui-react";
import { CardAuthError } from "./CardAuthError";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  headline,
  description,
  loginLabel,
  alreadyHaveCardLabel,
  isLoading,
  isResolving,
  error,
  onLoginPress,
  onAlreadyHaveCardPress,
  intro,
}: CardLoginViewProps) {
  return (
    <>
      {isResolving ? (
        <CardLoginSkeleton />
      ) : (
        <div className="flex flex-col gap-24 text-center">
          <div className="flex flex-col gap-12">
            <h2 className="heading-2-semi-bold text-base">{headline}</h2>
            <p className="body-2 text-muted">{description}</p>
          </div>
          <div className="flex flex-col items-center gap-16">
            <Button
              appearance="base"
              size="md"
              loading={isLoading}
              disabled={isLoading}
              onClick={onLoginPress}
              aria-label={loginLabel}
            >
              {loginLabel}
            </Button>
            {alreadyHaveCardLabel ? (
              <Button
                appearance="no-background"
                size="md"
                disabled={isLoading}
                onClick={onAlreadyHaveCardPress}
                aria-label={alreadyHaveCardLabel}
              >
                {alreadyHaveCardLabel}
              </Button>
            ) : null}
          </div>
        </div>
      )}
      <CardAuthError error={error} />
      <CardLoginIntroView {...intro} />
    </>
  );
}

function CardLoginSkeleton() {
  return (
    <div className="flex flex-col items-center gap-24" data-testid="card-login-skeleton">
      <div className="flex flex-col items-center gap-12">
        <Skeleton className="h-20 w-176 rounded-full" />
        <Skeleton className="h-12 w-112 rounded-full" />
      </div>
      <Skeleton className="h-40 w-128 rounded-full" />
    </div>
  );
}
