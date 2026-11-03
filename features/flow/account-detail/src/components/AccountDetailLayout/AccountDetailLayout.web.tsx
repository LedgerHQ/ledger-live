import React from "react";
import type { AccountDetailLayoutProps } from "./AccountDetailLayout.types";

export function AccountDetailLayout({
  hero,
  customPlace,
  analyticsNotice,
  assets,
  transactions,
}: AccountDetailLayoutProps) {
  return (
    <div className="flex flex-col gap-32" data-testid="account-detail-layout">
      {hero}
      <div className="flex flex-col gap-24" data-testid="account-detail-layout-sections">
        {customPlace}
        {analyticsNotice}
        {assets}
        {transactions}
      </div>
    </div>
  );
}
