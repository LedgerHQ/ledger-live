import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  title,
  description,
  loginLabel,
  alreadyHaveCardLabel,
  isLoading,
  errorMessage,
  onLoginPress,
  onAlreadyHaveCardPress,
  intro,
}: CardLoginViewProps) {
  return (
    <>
      <div className="flex flex-col gap-24 text-center">
        <div className="flex flex-col gap-12">
          <h2 className="heading-2-semi-bold text-base">{title}</h2>
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
          {errorMessage ? <span className="body-3 text-error">{errorMessage}</span> : null}
        </div>
      </div>
      <CardLoginIntroView {...intro} />
    </>
  );
}
