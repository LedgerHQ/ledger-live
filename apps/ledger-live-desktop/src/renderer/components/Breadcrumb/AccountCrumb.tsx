import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Box from "~/renderer/components/Box";
import { useHistory, useParams } from "react-router-dom";
import {
  listSubAccounts,
  getAccountCurrency,
  findSubAccountById,
} from "@ledgerhq/live-common/account/index";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import IconCheck from "~/renderer/icons/Check";
import IconAngleDown from "~/renderer/icons/AngleDown";
import IconAngleUp from "~/renderer/icons/AngleUp";
import DropDownSelector from "~/renderer/components/DropDownSelector";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { Separator, Item, TextLink, AngleDown, Check } from "./common";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";

type ItemShape = {
  key: string;
  label: string;
  account: Account | TokenAccount;
};

const AccountCrumb = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { parentId, id } = useParams<{ parentId?: string; id?: string }>();

  const accounts = useSelector(accountsSelector);

  const account: Account | undefined | null = useMemo(
    () => (parentId ? accounts.find(a => a.id === parentId) : accounts.find(a => a.id === id)),
    [parentId, accounts, id],
  );

  const tokenAccount: AccountLike | undefined | null = useMemo(
    () => (parentId && account && id ? findSubAccountById(account, id) : null),
    [parentId, account, id],
  );

  const currency = useMemo(
    () =>
      tokenAccount
        ? getAccountCurrency(tokenAccount)
        : account
          ? getAccountCurrency(account)
          : null,
    [tokenAccount, account],
  );

  const items = useMemo(
    () => (parentId && account ? listSubAccounts(account) : accounts),
    [parentId, account, accounts],
  );

  const walletState = useSelector(walletSelector);

  const renderItem = useCallback(
    ({ item, isActive }: { item: ItemShape; isActive: boolean }) => {
      const currency = getAccountCurrency(item.account);
      const name = accountNameWithDefaultSelector(walletState, item.account);
      return (
        <Item key={item.key} isActive={isActive}>
          <CryptoCurrencyIcon size={16} currency={currency} />
          <Ellipsis ff={`Inter|${isActive ? "SemiBold" : "Regular"}`} fontSize={4}>
            {name}
          </Ellipsis>
          {isActive && (
            <Check>
              <IconCheck size={14} />
            </Check>
          )}
        </Item>
      );
    },
    [walletState],
  );

  const onAccountSelected = useCallback(
    (item: ItemShape) => {
      if (!item) {
        return;
      }
      setTrackingSource("account breadcrumb");
      if (parentId) {
        history.push({
          pathname: `/account/${parentId}/${item.key}`,
        });
      } else {
        history.push({
          pathname: `/account/${item.key}`,
        });
      }
    },
    [parentId, history],
  );

  const openActiveAccount = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setTrackingSource("account breadcrumb");
      if (parentId) {
        if (id) {
          history.push({
            pathname: `/account/${parentId}/${id}`,
          });
        }
      } else {
        if (id) {
          history.push({
            pathname: `/account/${id}`,
          });
        }
      }
    },
    [history, parentId, id],
  );

  const processItemsForDropdown = useCallback(
    (items: (Account | TokenAccount)[]) =>
      items.map(item => ({
        key: item.id,
        label: accountNameWithDefaultSelector(walletState, item),
        account: item,
      })),
    [walletState],
  );

  const processedItems = useMemo(
    () => processItemsForDropdown(items || []),
    [items, processItemsForDropdown],
  );

  // no more id can happens if the account were just deleted
  if (!id) {
    return (
      <TextLink>
        <Button
          onClick={() => {
            setTrackingSource("account breadcrumb");
            history.push({
              pathname: "/accounts/",
            });
          }}
        >
          {t("accounts.title")}
        </Button>
      </TextLink>
    );
  }

  return (
    <>
      <Separator />
      <DropDownSelector
        items={processedItems}
        renderItem={renderItem}
        onChange={onAccountSelected}
        controlled
        value={processedItems.find(a => a.key === id)}
      >
        {({ isOpen, value }) =>
          value ? (
            <Box flex={1} shrink={!!parentId} horizontal>
              <TextLink shrink>
                {currency && <CryptoCurrencyIcon size={14} currency={currency} />}
                <Button onClick={openActiveAccount}>
                  <Ellipsis>{value.label}</Ellipsis>
                </Button>
                <AngleDown>
                  {isOpen ? <IconAngleUp size={16} /> : <IconAngleDown size={16} />}
                </AngleDown>
              </TextLink>
            </Box>
          ) : null
        }
      </DropDownSelector>
    </>
  );
};
export default AccountCrumb;
