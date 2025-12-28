import React, { useMemo } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountList } from "@ledgerhq/react-ui/pre-ldls/index";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/modularDrawer.types";
import { AccountTuple } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { BaseRawDetailedAccount } from "@ledgerhq/live-common/modularDrawer/types/detailedAccount";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { useSelector } from "react-redux";
import {
  localeSelector,
  discreetModeSelector,
  counterValueCurrencySelector,
} from "~/renderer/reducers/settings";
import BigNumber from "bignumber.js";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  detailedAccounts: BaseRawDetailedAccount[];
  bottomComponent: React.ReactNode;
};

const TITLE_HEIGHT = 52;
const LIST_HEIGHT = `calc(100% - ${TITLE_HEIGHT}px)`;

export const SelectAccountList = ({
  detailedAccounts,
  accounts,
  onAccountSelected,
  bottomComponent,
}: SelectAccountProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

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
      fiatValue: formatCurrencyUnit(
        counterValueCurrency.units[0],
        new BigNumber(account.fiatValue),
        {
          showCode: true,
          discreet,
          locale,
        },
      ),
    }));
  }, [detailedAccounts, locale, discreet, counterValueCurrency]);

  const trackAccountClick = (name: string) => {
    trackModularDrawerEvent("account_clicked", {
      currency: name,
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
    });
  };

  const onAccountClick = (accountId: string) => {
    // First, check if the accountId matches a subAccount (token account)
    const tupleWithSub = accounts.find(
      ({ subAccount }) => subAccount && subAccount.id === accountId,
    );
    if (tupleWithSub?.subAccount) {
      onAccountSelected(tupleWithSub.subAccount, tupleWithSub.account);
      trackAccountClick(tupleWithSub.subAccount.token.ticker);
      return;
    }

    // If not found as a subAccount, check if it's a parent account
    const currencyAccount = accounts.find(({ account }) => account.id === accountId);
    if (currencyAccount) {
      onAccountSelected(currencyAccount.account);
      trackAccountClick(currencyAccount.account.currency.name);
    }
  };

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <AccountList
        bottomComponent={bottomComponent}
        accounts={formattedAccounts}
        onClick={onAccountClick}
      />
    </ListWrapper>
  );
};
