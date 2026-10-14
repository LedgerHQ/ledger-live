import React from "react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { ChainIntegratorNoticeProps } from "./ChainIntegratorNotice.types";
import { useChainIntegratorNotice } from "./useChainIntegratorNotice";

export function ChainIntegratorNotice({ currency }: ChainIntegratorNoticeProps) {
  const label = useChainIntegratorNotice(currency.family);
  if (!label) return null;

  return (
    <div className="flex items-center gap-4 text-muted" data-testid="chain-integrator-notice">
      <Information size={16} aria-hidden />
      <p className="body-2 text-muted">{label}</p>
    </div>
  );
}
