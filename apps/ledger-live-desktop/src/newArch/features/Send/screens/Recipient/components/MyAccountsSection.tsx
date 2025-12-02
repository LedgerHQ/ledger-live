import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Subheader } from "@ledgerhq/ldls-ui-react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { AccountRowWithBalance } from "./AccountRowWithBalance";

type MyAccountsSectionProps = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  currentAccountId: string;
  onSelect: (account: Account) => void;
}>;

export function MyAccountsSection({
  currency,
  currentAccountId,
  onSelect,
}: MyAccountsSectionProps) {
  const { t } = useTranslation();
  const allAccounts = useSelector(accountsSelector);

  const userAccountsForCurrency = useMemo(() => {
    return allAccounts.filter(acc => {
      if (acc.id === currentAccountId) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, currentAccountId]);

  const accountNames = useBatchMaybeAccountName(userAccountsForCurrency);

  if (userAccountsForCurrency.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-w-0 mt-8">
      <Subheader className="mb-12 px-24" title={t("newSendFlow.myAccounts")} />
      <div className="flex flex-col gap-12 px-12">
        {userAccountsForCurrency.map((account, index) => (
          <AccountRowWithBalance
            key={account.id}
            account={account}
            customName={accountNames[index]}
            onSelect={() => onSelect(account)}
          />
        ))}
      </div>
    </div>
  );
}
