import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { CoinsAddPlus } from "@ledgerhq/lumen-ui-react/symbols";
import type { ClaimFundsButtonViewProps } from "./types";

// Development-only (local node mode), like the local node banner: not translated.
export function ClaimFundsButtonView({
  isVisible,
  isClaiming,
  error,
  onClaim,
}: ClaimFundsButtonViewProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-8">
      {error ? (
        <span className="max-w-256 truncate body-3 text-error" title={error}>
          {error}
        </span>
      ) : null}
      <Button
        appearance="accent"
        size="sm"
        icon={CoinsAddPlus}
        loading={isClaiming}
        disabled={isClaiming}
        onClick={onClaim}
        data-testid="local-node-claim-funds-button"
      >
        Claim funds
      </Button>
    </div>
  );
}
