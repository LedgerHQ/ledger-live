import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  description,
  loginLabel,
  isLoading,
  errorMessage,
  onLoginPress,
  intro,
}: CardLoginViewProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between gap-16">
          <span className="body-3 min-w-0 flex-1 text-muted">{description}</span>
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
        </div>
        {errorMessage ? <span className="body-3 self-end text-error">{errorMessage}</span> : null}
      </div>
      <CardLoginIntroView {...intro} />
    </>
  );
}
