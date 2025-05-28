import React from "react";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { AccountList, Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";
import { AccountTuple } from "~/renderer/components/PerCurrencySelectAccount/state";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { ListWrapper } from "../../../components/ListWrapper";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  source: string;
  flow: string;
  detailedAccounts: DetailedAccount[];
};

const ACCOUNT_PAGE = "Modular Account Selection";

export const SelectAccountList = ({
  detailedAccounts,
  accounts,
  source,
  flow,
  onAccountSelected,
}: SelectAccountProps) => {
  const trackAccountClick = (ticker: string) => {
    track("account_clicked", {
      currency: ticker,
      page: "Modular Account Selection",
      flow,
    });
  };

  const onAccountClick = (accountId: string) => {
    const currencyAccount = accounts.find(({ account }) => account.id === accountId);
    if (currencyAccount) {
      onAccountSelected(currencyAccount.account);
      trackAccountClick(currencyAccount.account.currency.ticker);
    } else {
      let tokenAccount: TokenAccount | undefined;
      let parentAccount: Account | undefined;

      for (const { account } of accounts) {
        tokenAccount = account.subAccounts?.find(({ id }) => id === accountId);
        if (tokenAccount) {
          parentAccount = accounts.find(
            ({ account }) => account.id === tokenAccount?.parentId,
          )?.account;
          break;
        }
      }

      if (tokenAccount && parentAccount) {
        onAccountSelected(tokenAccount, parentAccount);
        trackAccountClick(tokenAccount.token.ticker);
      }
    }
  };

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  const detailedAccountsWithName = detailedAccounts.map((account, index) => {
    const accountName = overridedAccountName[index];
    return {
      ...account,
      name: accountName ?? account.name,
    };
  });

  return (
    <ListWrapper>
      <TrackPage category={source} name={ACCOUNT_PAGE} flow={flow} />
      <AccountList accounts={detailedAccountsWithName} onClick={onAccountClick} />
    </ListWrapper>
  );
};
