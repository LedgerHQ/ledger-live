import React, { useCallback, useMemo } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountVirtualList } from "../AccountVirtualList";
import { Account as AccountRow } from "../AccountListItem";
import { useModularDialogAnalytics } from "../../../../analytics/useModularDialogAnalytics";
import { MODULAR_DIALOG_PAGE_NAME } from "../../../../analytics/modularDialog.types";
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
import { useContactsStore } from "~/renderer/contacts/hooks";
import { resolveContact } from "~/renderer/contacts/useDisplayAddress";
import { SignedNameBadge } from "LLD/components/SignedNameBadge";

type AccountSelectorContentProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  detailedAccounts: BaseRawDetailedAccount[];
  bottomComponent: React.ReactNode;
  /** EVM chain id of the selected asset — drives the Contacts decoration on each row. */
  chainId?: number;
};

export const AccountSelectorContent = ({
  detailedAccounts,
  accounts,
  onAccountSelected,
  bottomComponent,
  chainId,
}: AccountSelectorContentProps) => {
  const { trackModularDialogEvent } = useModularDialogAnalytics();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { wallet, hydrated } = useContactsStore();

  const getTitleDecoration = useCallback(
    (account: AccountRow): React.ReactNode => {
      if (!hydrated || chainId === undefined || !account.address) return null;
      const resolution = resolveContact(wallet, account.address, chainId);
      if (resolution?.kind !== "ledgerAccount") return null;
      // Shield-check (not the green name pill) — same signed-with-Ledger
      // affordance as the CryptoAddresses table and the send-flow rows.
      return <SignedNameBadge data-testid="account-selector-signed-name-badge" />;
    },
    [hydrated, wallet, chainId],
  );

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
    trackModularDialogEvent("account_clicked", {
      currency: name,
      page: MODULAR_DIALOG_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
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
    <AccountVirtualList
      bottomComponent={bottomComponent}
      accounts={formattedAccounts}
      onClick={onAccountClick}
      getTitleDecoration={getTitleDecoration}
    />
  );
};
