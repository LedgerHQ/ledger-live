import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MyAccountsSectionView } from "./MyAccountsSectionView";
import { useMyAccountsSectionViewModel } from "../hooks/useMyAccountsSectionViewModel";

type MyAccountsSectionProps = Readonly<{
  currency: CryptoOrTokenCurrency;
  currentAccountId: string;
  onSelect: (account: Account) => void;
}>;

export function MyAccountsSection({
  currency,
  currentAccountId,
  onSelect,
}: MyAccountsSectionProps) {
  const { userAccountsForCurrency, accountNames } = useMyAccountsSectionViewModel({
    currency,
    currentAccountId,
  });

  return (
    <MyAccountsSectionView
      userAccountsForCurrency={userAccountsForCurrency}
      accountNames={accountNames}
      onSelect={onSelect}
    />
  );
}
