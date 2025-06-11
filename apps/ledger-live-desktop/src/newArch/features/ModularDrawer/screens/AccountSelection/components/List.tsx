import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountList, Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";
import { AccountTuple } from "~/renderer/components/PerCurrencySelectAccount/state";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/types";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  source: string;
  flow: string;
  detailedAccounts: DetailedAccount[];
};

const TITLE_HEIGHT = 52;
const ROW_MARGIN = 8;
const BUTTON_HEIGHT = 66;
const MARGIN_BOTTOM = TITLE_HEIGHT + ROW_MARGIN + BUTTON_HEIGHT;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

export const SelectAccountList = ({
  detailedAccounts,
  accounts,
  source,
  flow,
  onAccountSelected,
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

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  const detailedAccountsWithName = detailedAccounts.map((account, index) => {
    const accountName = overridedAccountName[index];
    return {
      ...account,
      name: accountName ?? account.name,
    };
  });

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <AccountList accounts={detailedAccountsWithName} onClick={onAccountClick} />
    </ListWrapper>
  );
};
