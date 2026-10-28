import React, { Suspense } from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountNotices } from "@features/flow-account-detail-notices";
import { FamilyBlocks } from "./FamilyBlocks";
import { useCurrencyConfig } from "./useCurrencyConfig";
import { useAccountNoticesViewModel } from "./useAccountNoticesViewModel";

type Props = Readonly<{ account: Account }>;

export const FamilySection = ({ account }: Props) => {
  const currencyConfig = useCurrencyConfig(account.currency.id);

  return (
    <section className="flex flex-col gap-16 empty:hidden" data-testid="account-detail-family">
      <AccountNotices
        {...useAccountNoticesViewModel(account, currencyConfig)}
        testID="account-detail-notices"
      />
      <Suspense fallback={null}>
        <FamilyBlocks account={account} currencyConfig={currencyConfig} />
      </Suspense>
    </section>
  );
};
