import React, { type ReactNode } from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";

type ContactsLedgerSyncLoadingPaneProps = Readonly<{
  testId: string;
  children?: ReactNode;
}>;

export function ContactsLedgerSyncLoadingPane({
  testId,
  children,
}: ContactsLedgerSyncLoadingPaneProps): React.ReactNode {
  return (
    <div className="relative flex min-h-0 flex-1">
      {children}
      <div
        aria-busy="true"
        className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface"
        data-testid={testId}
      >
        <Spinner size={32} />
      </div>
    </div>
  );
}
