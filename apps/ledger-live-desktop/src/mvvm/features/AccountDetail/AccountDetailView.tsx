import React from "react";
import { AccountDetailLayout } from "@features/flow-account-detail";

export function AccountDetailView() {
  return (
    <AccountDetailLayout
      hero={<section className="rounded-md bg-error p-48" data-testid="account-detail-hero" />}
      customPlace={
        <section className="rounded-md bg-warning p-32" data-testid="account-detail-custom-place" />
      }
      assets={
        <section className="rounded-md bg-success p-48" data-testid="account-detail-assets" />
      }
      transactions={
        <section className="rounded-md bg-active p-48" data-testid="account-detail-transactions" />
      }
    />
  );
}
