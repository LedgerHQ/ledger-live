import React, { useMemo, useCallback } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../../../analytics/modularDrawer.types";
import { AccountTuple } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { BaseRawDetailedAccount } from "@ledgerhq/live-common/modularDrawer/types/detailedAccount";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { useSelector } from "react-redux";
import { localeSelector, discreetModeSelector } from "~/renderer/reducers/settings";
import styled from "styled-components";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  detailedAccounts: BaseRawDetailedAccount[];
  bottomComponent: React.ReactNode;
};

const TITLE_HEIGHT = 52;
const LIST_HEIGHT = `calc(100% - ${TITLE_HEIGHT}px)`;

const ScrollableContainer = styled.div`
  height: ${LIST_HEIGHT};
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0 8px;
  display: flex;
  flex-direction: column;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--colors-content-subdued-default-default);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--colors-content-default-default);
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const BottomContainer = styled.div`
  flex-shrink: 0;
  padding-top: 8px;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const BalanceText = styled.span`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--colors-content-default-default);
`;

const AddressText = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--colors-content-subdued-default-default);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SelectAccountList = ({
  detailedAccounts,
  accounts,
  onAccountSelected,
  bottomComponent,
}: SelectAccountProps) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const formattedAccounts = useMemo(() => {
    return detailedAccounts.map(account => ({
      ...account,
      balanceFormatted:
        account.balance !== undefined && account.balance !== null && account.balanceUnit
          ? formatCurrencyUnit(account.balanceUnit, account.balance, {
              showCode: true,
              discreet,
              locale,
            })
          : "",
      // Truncate address for display
      addressTruncated: account.address
        ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
        : "",
    }));
  }, [detailedAccounts, locale, discreet]);

  const trackAccountClick = (name: string) => {
    trackModularDrawerEvent("account_clicked", {
      currency: name,
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
    });
  };

  const handleAccountClick = useCallback(
    (accountId: string) => {
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
    },
    [accounts, onAccountSelected, trackAccountClick],
  );

  // Find the currency for the icon
  const getCurrency = (accountId: string) => {
    const tuple = accounts.find(
      ({ account, subAccount }) => account.id === accountId || subAccount?.id === accountId,
    );
    if (tuple?.subAccount?.id === accountId) {
      return tuple.subAccount.token;
    }
    return tuple?.account.currency;
  };

  return (
    <ListWrapper customHeight={LIST_HEIGHT}>
      <ScrollableContainer>
        <ListContainer>
          {formattedAccounts.map(account => {
            const currency = getCurrency(account.id);
            if (!currency) return null;

            return (
              <ListItem
                key={account.id}
                title={account.name}
                description={account.addressTruncated}
                leadingContent={
                  <IconWrapper>
                    <CryptoCurrencyIcon currency={currency} size={32} />
                  </IconWrapper>
                }
                trailingContent={
                  <BalanceContainer>
                    <BalanceText>{account.balanceFormatted}</BalanceText>
                    <AddressText>{account.ticker}</AddressText>
                  </BalanceContainer>
                }
                onClick={() => handleAccountClick(account.id)}
              />
            );
          })}
        </ListContainer>
        {bottomComponent && <BottomContainer>{bottomComponent}</BottomContainer>}
      </ScrollableContainer>
    </ListWrapper>
  );
};
