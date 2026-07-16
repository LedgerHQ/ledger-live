import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";

export function ContactsLedgerSyncLoadingOverlay(): React.ReactNode {
  return (
    <div
      aria-busy="true"
      className="absolute inset-0 z-10 flex items-center justify-center bg-canvas-overlay backdrop-blur-sm"
      data-testid="contacts-ledger-sync-loading-overlay"
    >
      <Spinner size={32} />
    </div>
  );
}
