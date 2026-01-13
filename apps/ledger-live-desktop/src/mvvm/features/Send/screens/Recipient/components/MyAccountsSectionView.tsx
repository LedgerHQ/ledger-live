import React from "react";
import { useTranslation } from "react-i18next";
import { Subheader } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { AccountRowWithBalance } from "./AccountRowWithBalance";

type MyAccountsSectionViewProps = Readonly<{
  userAccountsForCurrency: Account[];
  accountNames: (string | undefined)[];
  onSelect: (account: Account) => void;
}>;

export function MyAccountsSectionView({
  userAccountsForCurrency,
  accountNames,
  onSelect,
}: MyAccountsSectionViewProps) {
  const { t } = useTranslation();

  if (userAccountsForCurrency.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-8 pb-12">
      <Subheader className="mb-6" title={t("newSendFlow.myAccounts")} />
      <div className="-mx-8">
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
