import React, { useCallback, useEffect } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer/hooks/useModularDrawerController";
import { ModularDrawerNavigatorStackParamList } from "~/components/RootNavigator/types/ModularDrawerNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";

export type ModularDrawerDeepLinkHandlerProps = StackNavigatorProps<
  ModularDrawerNavigatorStackParamList,
  ScreenName.ModularDrawerDeepLinkHandler
>;

export type ReceiveDeepLinkHandlerProps = StackNavigatorProps<
  ModularDrawerNavigatorStackParamList,
  ScreenName.ReceiveDeepLinkHandler
>;

export type AddAccountDeepLinkHandlerProps = StackNavigatorProps<
  ModularDrawerNavigatorStackParamList,
  ScreenName.AddAccountDeepLinkHandler
>;

function ModularDrawerDeepLinkHandlerCore({
  flow,
  currency,
}: {
  flow: "add-account" | "receive";
  currency?: string;
}) {
  const navigation = useNavigation();
  const { openDrawer } = useModularDrawerController();

  const currencyToAdd = currency ? findCryptoCurrencyByKeyword(currency) : undefined;

  const openFlow = useCallback(() => {
    if (flow === "receive") {
      //  Implement receive flow in PR https://github.com/LedgerHQ/ledger-live/pull/12312
    } else {
      openDrawer({
        currencies: currencyToAdd ? [currencyToAdd.id] : undefined,
        flow: "add-account",
        source: "deeplink",
        areCurrenciesFiltered: !!currencyToAdd,
      });
    }
  }, [currencyToAdd, flow, openDrawer]);

  useEffect(() => {
    // Navigate to Portfolio first to ensure we have a base screen
    navigation.dispatch(
      StackActions.replace(NavigatorName.Base, {
        screen: NavigatorName.Main,
        params: {
          screen: NavigatorName.Portfolio,
          params: {
            screen: NavigatorName.WalletTab,
            params: {
              screen: ScreenName.Portfolio,
            },
          },
        },
      }),
    );

    openFlow();

    /**
     * to avoid infinite re-render
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function ModularDrawerDeepLinkHandler({ route }: ModularDrawerDeepLinkHandlerProps) {
  const { currency, flow } = route.params || {};
  return <ModularDrawerDeepLinkHandlerCore flow={flow || "add-account"} currency={currency} />;
}

/**
 * Wrapper for receive flow deeplink
 * Route: ledgerlive://receive?currency=bitcoin
 */
export function ReceiveDeepLinkHandler({ route }: ReceiveDeepLinkHandlerProps) {
  const { currency } = route.params || {};
  return <ModularDrawerDeepLinkHandlerCore flow="receive" currency={currency} />;
}

/**
 * Wrapper for add-account flow deeplink
 * Route: ledgerlive://add-account?currency=ethereum
 */
export function AddAccountDeepLinkHandler({ route }: AddAccountDeepLinkHandlerProps) {
  const { currency } = route.params || {};
  return <ModularDrawerDeepLinkHandlerCore flow="add-account" currency={currency} />;
}
