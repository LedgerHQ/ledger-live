import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountDetailLayout } from "@features/flow-account-detail";
import { AccountEmptyState } from "@features/flow-account-detail-hero/web";
import { AssetsSection } from "./components/AssetsSection";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Transactions } from "./components/Transactions";
import { useAccountDetailContentViewModel } from "./hooks/useAccountDetailContentViewModel";

type Props = Readonly<{ account: Account }>;

export function AccountDetailView({ account }: Props) {
  const { hero, emptyState } = useAccountDetailContentViewModel(account);

  return (
    <div className="flex flex-col gap-24 pb-32">
      <Header account={account} />
      <AccountDetailLayout
        hero={<Hero {...hero} />}
        customPlace={
          <section
            className="rounded-md bg-warning p-32"
            data-testid="account-detail-custom-place"
          />
        }
        assets={
          emptyState.isVisible ? (
            <AccountEmptyState
              fundingActions={emptyState.fundingActions}
              testID="account-detail-empty-state"
            />
          ) : (
            <AssetsSection account={account} />
          )
        }
        transactions={emptyState.isVisible ? null : <Transactions account={account} />}
      />
    </div>
  );
}
