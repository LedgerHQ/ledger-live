import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { openModal } from "~/renderer/actions/modals";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import IconStar from "~/renderer/icons/Star";
import IconBuy from "~/renderer/icons/Exchange";
import IconSwap from "~/renderer/icons/Swap";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import ContextMenuItem from "./ContextMenuItem";
import { toggleStarAction } from "~/renderer/actions/wallet";
import { useRefreshAccountsOrdering } from "~/renderer/actions/general";
import { swapSelectableCurrenciesSelector } from "~/renderer/reducers/settings";
import { isCurrencySupported } from "~/renderer/screens/exchange/config";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { ContextMenuItemType } from "./ContextMenuWrapper";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { accountStarredSelector } from "~/renderer/reducers/wallet";
import { State } from "~/renderer/reducers";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  leftClick?: boolean;
  children: React.ReactNode;
  withStar?: boolean;
};

export default function AccountContextMenu({
  leftClick,
  children,
  account,
  parentAccount,
  withStar,
}: Props) {
  const history = useHistory();
  const dispatch = useDispatch();
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  const swapSelectableCurrencies = useSelector(swapSelectableCurrenciesSelector);

  const isStarred = useSelector((state: State) =>
    accountStarredSelector(state, { accountId: account.id }),
  );

  const menuItems = useMemo(() => {
    const currency = getAccountCurrency(account);
    const mainAccount = getMainAccount(account, parentAccount);
    const items: ContextMenuItemType[] = [
      {
        label: "accounts.contextMenu.send",
        Icon: IconSend,
        callback: () =>
          dispatch(
            openModal("MODAL_SEND", {
              account,
              parentAccount,
            }),
          ),
      },
      {
        label: "accounts.contextMenu.receive",
        Icon: IconReceive,
        callback: () =>
          dispatch(
            openModal("MODAL_RECEIVE", {
              account,
              parentAccount,
            }),
          ),
      },
    ];
    const availableOnBuy = isCurrencySupported("BUY", currency);
    if (availableOnBuy) {
      items.push({
        label: "accounts.contextMenu.buy",
        Icon: IconBuy,
        callback: () => {
          setTrackingSource("account context menu");
          history.push({
            pathname: "/exchange",
            state: {
              currency: currency?.id,
              account: mainAccount?.id,
              mode: "buy", // buy or sell
            },
          });
        },
      });
    }
    const availableOnSell = isCurrencySupported("SELL", currency);
    if (availableOnSell) {
      items.push({
        label: "accounts.contextMenu.sell",
        Icon: IconBuy,
        callback: () => {
          setTrackingSource("account context menu");
          history.push({
            pathname: "/exchange",
            state: {
              currency: currency?.id,
              account: mainAccount?.id,
              mode: "sell", // buy or sell
            },
          });
        },
      });
    }
    const availableOnSwap = swapSelectableCurrencies.includes(currency.id);
    if (availableOnSwap) {
      items.push({
        label: "accounts.contextMenu.swap",
        Icon: IconSwap,
        callback: () => {
          setTrackingSource("account context menu");
          history.push({
            pathname: "/swap",
            state: {
              defaultCurrency: currency,
              defaultAccount: account,
              defaultParentAccount: parentAccount,
              from: history.location.pathname,
            },
          });
        },
      });
    }
    if (withStar) {
      items.push({
        label: "accounts.contextMenu.star",
        Icon: IconStar,
        callback: () => {
          dispatch(toggleStarAction(account.id, !isStarred));
          refreshAccountsOrdering();
        },
      });
    }
    if (account.type === "Account") {
      items.push({
        label: "accounts.contextMenu.edit",
        Icon: IconAccountSettings,
        callback: () =>
          dispatch(
            openModal("MODAL_SETTINGS_ACCOUNT", {
              account,
            }),
          ),
      });
    }
    if (account.type === "TokenAccount") {
      items.push({
        label: "accounts.contextMenu.hideToken",
        Icon: IconsLegacy.NoneMedium,
        id: "token-menu-hide",
        callback: () =>
          dispatch(
            openModal("MODAL_BLACKLIST_TOKEN", {
              token: account.token,
            }),
          ),
      });
    }
    return items;
  }, [
    account,
    parentAccount,
    swapSelectableCurrencies,
    withStar,
    dispatch,
    history,
    refreshAccountsOrdering,
    isStarred,
  ]);
  const currency = getAccountCurrency(account);
  return (
    <ContextMenuItem
      event={account.type === "Account" ? "Account right click" : "Token right click"}
      eventProperties={{
        currencyName: currency.name,
      }}
      leftClick={leftClick}
      items={menuItems}
    >
      {children}
    </ContextMenuItem>
  );
}
