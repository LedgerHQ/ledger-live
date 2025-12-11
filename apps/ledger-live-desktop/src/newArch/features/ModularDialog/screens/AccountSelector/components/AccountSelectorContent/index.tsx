import React, { useMemo } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountVirtualList } from "../AccountVirtualList";
import { ListWrapper } from "../../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../../analytics/modularDrawer.types";
import { AccountTuple } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { BaseRawDetailedAccount } from "@ledgerhq/live-common/modularDrawer/types/detailedAccount";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { useSelector } from "react-redux";
import { localeSelector, discreetModeSelector } from "~/renderer/reducers/settings";

type AccountSelectorContentProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  detailedAccounts: BaseRawDetailedAccount[];
  bottomComponent: React.ReactNode;
};

const TITLE_HEIGHT = 52;
const LIST_HEIGHT = `calc(100% - ${TITLE_HEIGHT}px)`;

export const AccountSelectorContent = ({
  detailedAccounts,
  accounts,
  onAccountSelected,
  bottomComponent,
}: AccountSelectorContentProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const formattedAccounts = useMemo(() => {
    return detailedAccounts.map(account => ({
      ...account,
      balance:
        account.balance !== undefined && account.balance !== null && account.balanceUnit
          ? formatCurrencyUnit(account.balanceUnit, account.balance, {
              showCode: true,
              discreet,
              locale,
            })
          : "",
      fiatValue: "",
    }));
  }, [detailedAccounts, locale, discreet]);

  const trackAccountClick = (name: string) => {
    trackModularDrawerEvent("account_clicked", {
      currency: name,
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
    });
  };

  const onAccountClick = (accountId: string) => {
    const currencyAccount = accounts.find(({ account }) => account.id === accountId);
    if (currencyAccount) {
      onAccountSelected(currencyAccount.account);
      trackAccountClick(currencyAccount.account.currency.name);
      return;
    }

    const tupleWithSub = accounts.find(({ subAccount }) => subAccount?.id === accountId);
    if (tupleWithSub?.subAccount) {
      onAccountSelected(tupleWithSub.subAccount, tupleWithSub.account);
      trackAccountClick(tupleWithSub.subAccount.token.ticker);
    }
  };

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <AccountVirtualList
        bottomComponent={bottomComponent}
        accounts={formattedAccounts}
        onClick={onAccountClick}
      />
    </ListWrapper>
  );
};
