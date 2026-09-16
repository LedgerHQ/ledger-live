import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { NetworkWarning } from "@ledgerhq/lumen-ui-react/symbols";
import { CardAuthError } from "./CardAuthError";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  headline,
  description,
  loginLabel,
  alreadyHaveCardLabel,
  isLoading,
  error,
  onLoginPress,
  onAlreadyHaveCardPress,
  intro,
}: CardLoginViewProps) {
  if (error) {
    return <CardAuthError icon={NetworkWarning} {...error} />;
  }

  return (
    <>
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
      <CardLoginIntroView {...intro} />
    </>
  );
}
