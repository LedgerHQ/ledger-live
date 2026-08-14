import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  loginLabel,
  isHidden,
  isLoading,
  errorMessage,
  onLoginPress,
}: CardLoginViewProps) {
  if (isHidden) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-4">
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
      {errorMessage ? <span className="body-3 text-error">{errorMessage}</span> : null}
    </div>
  );
}
