import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountList, Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/modularDrawer.types";
import { AccountTuple } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  source: string;
  flow: string;
  detailedAccounts: DetailedAccount[];
  bottomComponent: React.ReactNode;
};

const TITLE_HEIGHT = 52;
const LIST_HEIGHT = `calc(100% - ${TITLE_HEIGHT}px)`;

export const SelectAccountList = ({
  detailedAccounts,
  accounts,
  source,
  flow,
  onAccountSelected,
  bottomComponent,
}: SelectAccountProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const trackAccountClick = (name: string) => {
    trackModularDrawerEvent("account_clicked", {
      currency: name,
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
      flow,
      source,
    });
  };

  const onAccountClick = (accountId: string) => {
    const currencyAccount = accounts.find(({ account }) => account.id === accountId);
    if (currencyAccount) {
      onAccountSelected(currencyAccount.account);
      trackAccountClick(currencyAccount.account.currency.name);
      return;
    }

    const tupleWithSub = accounts.find(
      ({ subAccount }) => subAccount && subAccount.id === accountId,
    );
    if (tupleWithSub?.subAccount) {
      onAccountSelected(tupleWithSub.subAccount, tupleWithSub.account);
      trackAccountClick(tupleWithSub.subAccount.token.ticker);
    }
  };

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <AccountList
        bottomComponent={bottomComponent}
        accounts={detailedAccounts}
        onClick={onAccountClick}
      />
    </ListWrapper>
  );
};
