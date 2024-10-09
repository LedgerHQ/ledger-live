import React, { useMemo, useCallback } from "react";
import Text from "~/renderer/components/Text";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { useSelector, useDispatch } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import { RowContainer, RowInnerContainer } from "./shared";
import styled from "styled-components";
import Plus from "~/renderer/icons/Plus";
import { darken } from "~/renderer/styles/helpers";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useTranslation } from "react-i18next";
import { useAccountName } from "~/renderer/reducers/wallet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const AddIconContainer = styled.div`
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => darken(theme.colors.palette.primary.main, 0.3)};
  color: ${({ theme }) => theme.colors.palette.primary.main};
`;

type Props = {
  currency: CryptoCurrency | TokenCurrency;
  onAccountSelect: (account: AccountLike, parentAccount?: Account) => void;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export function AccountList({ currency, onAccountSelect, accounts$ }: Props) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);

  const accountTuples = useMemo(() => {
    return getAccountTuplesForCurrency(currency, nestedAccounts, false, accountIds);
  }, [nestedAccounts, currency, accountIds]);
  const openAddAccounts = useCallback(() => {
    dispatch(
      openModal("MODAL_ADD_ACCOUNTS", {
        currency,
      }),
    );
  }, [dispatch, currency]);

  return (
    <>
      <RowContainer onClick={openAddAccounts} id="add-account">
        <RowInnerContainer>
          <Box horizontal alignItems="center">
            <AddIconContainer>
              <Plus size={12} />
            </AddIconContainer>
            <Text
              ff="Inter|SemiBold"
              color="inherit"
              fontSize="13px"
              style={{
                marginLeft: 12,
              }}
            >
              {t("addAccounts.cta.add")}
            </Text>
          </Box>
        </RowInnerContainer>
      </RowContainer>

      {accountTuples.map((accountTuple, index) => {
        const { account, subAccount } = accountTuple;
        return (
          <Row
            onAccountSelect={onAccountSelect}
            account={account}
            subAccount={subAccount}
            index={index}
            key={account.id}
          />
        );
      })}
    </>
  );
}

function Row({
  account,
  subAccount,
  index,
  onAccountSelect,
}: {
  account: Account;
  subAccount: TokenAccount | null | undefined;
  index: number;
  onAccountSelect: (account: AccountLike, parentAccount?: Account) => void;
}) {
  const accountCurrency = getAccountCurrency(subAccount || account);
  const accountName = useAccountName(account);
  const unit = useAccountUnit(subAccount || account);

  return (
    <RowContainer
      id={`account-${accountCurrency.name}-${index}`}
      data-testid={`account-row-${accountCurrency.name.toLowerCase()}-${index}`}
      onClick={() => {
        if (subAccount) {
          onAccountSelect(subAccount, account);
        } else {
          onAccountSelect(account);
        }
      }}
    >
      <RowInnerContainer>
        <Box
          horizontal
          alignItems="center"
          style={{
            flexShrink: 1,
          }}
        >
          <CryptoCurrencyIcon circle currency={accountCurrency} size={24} />
          <Text
            ff="Inter|SemiBold"
            color="inherit"
            fontSize="13px"
            style={{
              marginLeft: 12,
              textOverflow: "ellipsis",
              flexShrink: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {`${subAccount ? `${accountName} (${accountCurrency.ticker})` : accountName}`}
          </Text>
          <AccountTagDerivationMode account={account} margin="0 0 0 12px" />
        </Box>
        <Box horizontal alignItems="center" marginLeft="12px">
          <FormattedVal
            color="palette.text.shade50"
            val={subAccount ? subAccount.spendableBalance : account.spendableBalance}
            unit={unit}
            showCode
          />
        </Box>
      </RowInnerContainer>
    </RowContainer>
  );
}
