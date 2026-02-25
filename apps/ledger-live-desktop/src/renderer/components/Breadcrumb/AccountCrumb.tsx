import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import Box from "~/renderer/components/Box";
import { useNavigate, useParams } from "react-router";
import {
  listSubAccounts,
  getAccountCurrency,
  findSubAccountById,
} from "@ledgerhq/live-common/account/index";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  getAccountUrl,
  findAccountById,
  findItemByKey,
  findSubAccountByIdWithFallback,
} from "~/renderer/utils";
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { "*": splat } = useParams<{ "*": string }>();

  const { parentId, id } = useMemo(() => {
    if (!splat) {
      return { parentId: undefined, id: undefined };
    }
    const segments = splat.split("/").filter(Boolean);
    if (segments.length === 0) {
      return { parentId: undefined, id: undefined };
    }
    if (segments.length === 1) {
      return { parentId: undefined, id: segments[0] };
    }
    return {
      parentId: segments[0],
      id: segments.slice(1).join("/"),
    };
  }, [splat]);

  const accounts = useSelector(accountsSelector);

  const account: Account | undefined | null = useMemo(() => {
    if (parentId) {
      return findAccountById(accounts, parentId) || null;
    }
    if (id) {
      return findAccountById(accounts, id) || null;
    }
    return null;
  }, [parentId, accounts, id]);

  const tokenAccount: AccountLike | undefined | null = useMemo(() => {
    if (parentId && account && id) {
      return findSubAccountByIdWithFallback(account, id, findSubAccountById) || null;
    }
    return null;
  }, [parentId, account, id]);

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
          <CryptoCurrencyIcon size={22} currency={currency} />
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
      // If we're on a token account and selecting the parent account, navigate to parent only
      if (parentId && item.key === account?.id) {
        navigate(getAccountUrl(item.key));
      } else {
        navigate(getAccountUrl(item.key, parentId));
      }
    },
    [parentId, account, navigate],
  );

  const onParentAccountSelected = useCallback(
    (item: ItemShape) => {
      if (!item) {
        return;
      }
      setTrackingSource("account breadcrumb");
      navigate(getAccountUrl(item.key));
    },
    [navigate],
  );

  const openActiveAccount = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setTrackingSource("account breadcrumb");
      if (id) {
        navigate(getAccountUrl(id, parentId));
      }
    },
    [navigate, parentId, id],
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

  // For token accounts, we need to show the parent account in the breadcrumb
  const parentAccountValue = useMemo(() => {
    if (!parentId || !account) return undefined;
    return {
      key: account.id,
      label: accountNameWithDefaultSelector(walletState, account),
      account,
    };
  }, [parentId, account, walletState]);

  // Find the current value by matching id (try both encoded and non-encoded versions)
  const currentValue = useMemo(() => {
    if (!id) return undefined;
    // processedItems have 'key' instead of 'id', so we search by key
    return findItemByKey(processedItems, id);
  }, [processedItems, id]);

  // For token accounts, show parent account in breadcrumb
  const parentAccountItems = useMemo(
    () => (account ? processItemsForDropdown([account]) : []),
    [account, processItemsForDropdown],
  );

  // no more id can happens if the account were just deleted
  if (!id) {
    return (
      <TextLink>
        <Button
          onClick={() => {
            setTrackingSource("account breadcrumb");
            navigate("/accounts/");
          }}
        >
          {t("accounts.title")}
        </Button>
      </TextLink>
    );
  }

  return (
    <>
      <TextLink>
        <Button
          onClick={() => {
            setTrackingSource("account breadcrumb");
            navigate("/accounts/");
          }}
        >
          {t("accounts.title")}
        </Button>
      </TextLink>
      {parentId && account && (
        <>
          <Separator />
          <DropDownSelector
            items={parentAccountItems}
            renderItem={renderItem}
            onChange={onParentAccountSelected}
            controlled
            value={parentAccountValue}
          >
            {({ isOpen, value }) =>
              value ? (
                <Box flex={1} shrink horizontal>
                  <TextLink shrink>
                    {account && (
                      <CryptoCurrencyIcon size={20} currency={getAccountCurrency(account)} />
                    )}
                    <Button
                      onClick={() => {
                        setTrackingSource("account breadcrumb");
                        navigate(getAccountUrl(account.id));
                      }}
                    >
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
      )}
      <Separator />
      <DropDownSelector
        items={processedItems}
        renderItem={renderItem}
        onChange={onAccountSelected}
        controlled
        value={currentValue}
      >
        {({ isOpen, value }) =>
          value ? (
            <Box flex={1} shrink={!!parentId} horizontal>
              <TextLink shrink>
                {currency && <CryptoCurrencyIcon size={20} currency={currency} />}
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
