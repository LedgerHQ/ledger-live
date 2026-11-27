import React, { useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import {
  isReceiveDisabledForFamily,
  isSendDisabledForFamily,
} from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import IconBuy from "~/renderer/icons/Exchange";
import IconSwap from "~/renderer/icons/Swap";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import ContextMenuItem from "./ContextMenuItem";
import { swapSelectableCurrenciesSelector } from "~/renderer/reducers/settings";
import { isCurrencySupported } from "~/renderer/screens/exchange/config";
import { setTrackingSource } from "@shared/analytics";
import { RECEIVE_SOURCE_PAGE } from "LLD/features/Receive/types";
import { ContextMenuItemType } from "./ContextMenuWrapper";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useStake } from "LLD/hooks/useStake";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import IconCoins from "~/renderer/icons/Coins";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { buildSwapNavigationState } from "LLD/features/Market/utils/swapNavigation";
import { useLLDCoinFamily } from "~/renderer/families";

import { openReceiveFlow } from "LLD/features/Receive";
type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  leftClick?: boolean;
  children: React.ReactNode;
};

export default function AccountContextMenu({ leftClick, children, account, parentAccount }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const swapSelectableCurrencies = useSelector(swapSelectableCurrenciesSelector);

  const { getCanStakeCurrency, getRouteToPlatformApp } = useStake();
  const stakeLabel = useGetStakeLabelLocaleBased();
  const walletState = useSelector(walletSelector);
  const openSendFlow = useOpenSendFlow();
  const { isTransferDisabled } = useLLDCoinFamily(
    getMainAccount(account, parentAccount).currency.family,
  );

  const menuItems = useMemo(() => {
    const currency = getAccountCurrency(account);
    const mainAccount = getMainAccount(account, parentAccount);
    const family = mainAccount.currency.family;
    const transferDisabled = !!isTransferDisabled?.(account, parentAccount);
    const items: ContextMenuItemType[] = [];
    if (!isSendDisabledForFamily(family) && !transferDisabled) {
      items.push({
        label: "accounts.contextMenu.send",
        Icon: IconSend,
        callback: () =>
          openSendFlow({
            account,
            parentAccount: parentAccount ?? undefined,
          }),
      });
    }
    if (!isReceiveDisabledForFamily(family) && !transferDisabled) {
      items.push({
        label: "accounts.contextMenu.receive",
        Icon: IconReceive,
        callback: () =>
          dispatch(
            openReceiveFlow({
              account,
              parentAccount,
              sourcePage: RECEIVE_SOURCE_PAGE.ACCOUNT_PAGE,
            }),
          ),
      });
    }
    const availableOnBuy = isCurrencySupported("BUY", currency);
    if (availableOnBuy) {
      items.push({
        label: "accounts.contextMenu.buy",
        Icon: IconBuy,
        callback: () => {
          setTrackingSource("account context menu");
          navigate("/exchange", {
            state: {
              currency: currency?.id,
              account: mainAccount?.id,
              mode: "buy",
              returnTo: location.pathname,
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
          navigate("/exchange", {
            state: {
              currency: currency?.id,
              account: mainAccount?.id,
              mode: "sell",
              returnTo: location.pathname,
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
          navigate("/swap", {
            state: buildSwapNavigationState({
              defaultCurrency: currency,
              fromPath: location.pathname,
              account,
              parentAccount: parentAccount ?? undefined,
            }),
          });
        },
      });
    }
    const routeToStake = getRouteToPlatformApp(account, walletState, parentAccount);
    if (getCanStakeCurrency(currency.id) && routeToStake) {
      items.push({
        label: stakeLabel,
        Icon: IconCoins,
        callback: () => {
          setTrackingSource("account context menu");
          navigate(routeToStake.pathname, {
            state: {
              ...routeToStake.state,
            },
          });
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
    getRouteToPlatformApp,
    walletState,
    getCanStakeCurrency,
    dispatch,
    navigate,
    stakeLabel,
    openSendFlow,
    location.pathname,
    isTransferDisabled,
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
