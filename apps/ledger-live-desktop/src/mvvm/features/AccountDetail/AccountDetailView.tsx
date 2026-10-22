import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountDetailLayout } from "@features/flow-account-detail";
import { AssetsSection } from "./components/AssetsSection";
import { Header } from "./components/Header";
import { Transactions } from "./components/Transactions";

type Props = Readonly<{ account: Account }>;

export function AccountDetailView({ account }: Props) {
  return (
    <div className="flex flex-col gap-24 pb-32">
      <Header account={account} />
      <AccountDetailLayout
        hero={<section className="rounded-md bg-error p-48" data-testid="account-detail-hero" />}
        customPlace={
          <section
            className="rounded-md bg-warning p-32"
            data-testid="account-detail-custom-place"
          />
        }
        assets={<AssetsSection account={account} />}
        transactions={<Transactions account={account} />}
      />
    </div>
  );
}
