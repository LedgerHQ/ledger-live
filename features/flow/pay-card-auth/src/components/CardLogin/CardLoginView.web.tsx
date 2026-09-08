import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  title,
  description,
  loginLabel,
  isLoading,
  errorMessage,
  onLoginPress,
}: CardLoginViewProps) {
  return (
    <div className="flex flex-col gap-24 text-center">
      <div className="flex flex-col gap-12">
        <p className="heading-2-semi-bold text-base">{title}</p>
        <p className="body-2 text-muted">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-8">
        <Button
          appearance="base"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          onClick={onLoginPress}
          aria-label={loginLabel}
        >
          {loginLabel}
        </Button>
        {errorMessage ? <span className="body-3 text-error">{errorMessage}</span> : null}
      </div>
    </div>
  );
}
