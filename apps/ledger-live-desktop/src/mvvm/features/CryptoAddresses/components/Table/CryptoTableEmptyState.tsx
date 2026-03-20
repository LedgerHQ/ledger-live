import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";

type CryptoTableEmptyStateProps = {
  readonly message: string;
};

export function CryptoTableEmptyState({ message }: CryptoTableEmptyStateProps) {
  return (
    <div
      className="flex min-h-[400px] w-full flex-col items-center justify-center gap-24 py-24"
      data-testid="crypto-table-empty"
    >
      <Spot appearance="icon" icon={Wallet} />
      <p className="text-center heading-4-semi-bold text-base">{message}</p>
    </div>
  );
}
