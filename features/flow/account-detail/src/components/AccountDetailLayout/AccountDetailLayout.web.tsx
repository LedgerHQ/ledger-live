import React from "react";
import type { AccountDetailLayoutProps } from "./AccountDetailLayout.types";

export function AccountDetailLayout({
  hero,
  customPlace,
  assets,
  transactions,
}: AccountDetailLayoutProps) {
  return (
    <div className="flex flex-col gap-32" data-testid="account-detail-layout">
      {hero}
      {customPlace}
      {assets}
      {transactions}
    </div>
  );
}
