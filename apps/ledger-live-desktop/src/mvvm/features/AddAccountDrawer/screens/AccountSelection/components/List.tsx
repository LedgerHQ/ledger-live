import React, { useCallback, useMemo } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { VirtualList } from "LLD/components/VirtualList";
import {
  AccountRow,
  type AccountRowAccount,
} from "LLD/features/AddAccountDrawer/components/AccountRow";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDialogAnalytics } from "LLD/features/ModularDialog/analytics/useModularDialogAnalytics";
import { MODULAR_DIALOG_PAGE_NAME } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import { AccountTuple } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { BaseRawDetailedAccount } from "@ledgerhq/live-common/modularDrawer/types/detailedAccount";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { useSelector } from "LLD/hooks/redux";
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
  const { trackModularDialogEvent } = useModularDialogAnalytics();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const formattedAccounts = useMemo((): AccountRowAccount[] => {
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

  const onAccountClick = useCallback(
    (accountId: string) => {
      const trackAccountClick = (name: string) => {
        trackModularDialogEvent("account_clicked", {
          currency: name,
          page: MODULAR_DIALOG_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
        });
      };

      const tupleWithSub = accounts.find(
        ({ subAccount }) => subAccount && subAccount.id === accountId,
      );
      if (tupleWithSub?.subAccount) {
        onAccountSelected(tupleWithSub.subAccount, tupleWithSub.account);
        trackAccountClick(tupleWithSub.subAccount.token.ticker);
        return;
      }

      const currencyAccount = accounts.find(({ account }) => account.id === accountId);
      if (currencyAccount) {
        onAccountSelected(currencyAccount.account);
        trackAccountClick(currencyAccount.account.currency.name);
      }
    },
    [accounts, onAccountSelected, trackModularDialogEvent],
  );

  const renderAccount = useCallback(
    (account: AccountRowAccount) => (
      <AccountRow account={account} onClick={() => onAccountClick(account.id)} />
    ),
    [onAccountClick],
  );

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <VirtualList
        items={formattedAccounts}
        itemHeight={64}
        bottomComponent={bottomComponent}
        renderItem={renderAccount}
        className="pb-40"
      />
    </ListWrapper>
  );
};
