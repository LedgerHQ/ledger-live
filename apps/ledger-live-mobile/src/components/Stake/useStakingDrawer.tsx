import { useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import perFamilyAccountActions from "../../generated/accountActions";
import { useSelector } from "react-redux";
import { walletSelector } from "~/reducers/wallet";

/** Open the stake flow for a given account from any navigator. Returns to parent route on completion. */
export function useStakingDrawer({
  navigation,
  parentRoute,
  alwaysShowNoFunds,
  entryPoint = undefined,
}: {
  navigation: StackNavigationProp<{ [key: string]: object | undefined }>;
  parentRoute: RouteProp<ParamListBase> | undefined;
  alwaysShowNoFunds?: boolean | undefined;
  entryPoint?: "get-funds" | undefined;
}) {
  const walletState = useSelector(walletSelector);

  return useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      if (alwaysShowNoFunds) {
        // get funds to stake with
        navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.NoFundsFlow,
          drawer: undefined,
          params: {
            screen: ScreenName.NoFunds,
            params: {
              account,
              parentAccount,
              entryPoint,
            },
          },
        });
        return;
      }

      const family =
        account.type === "TokenAccount"
          ? account?.token?.parentCurrency?.family
          : account?.currency?.family;
      // @ts-expect-error issue in typing
      const decorators = perFamilyAccountActions[family];

      // get the stake flow for the specific currency

      const familySpecificMainActions =
        (decorators &&
          decorators.getMainActions &&
          decorators.getMainActions({
            walletState,
            account,
            parentAccount,
            colors: {},
            parentRoute,
          })) ||
        [];
      const stakeFlow = familySpecificMainActions.find(
        (action: { id: string }) => action.id === "stake",
      )?.navigationParams;

      if (!stakeFlow) return null;

      const [name, options] = stakeFlow;

      // one level deep navigation
      if (!options.screen) {
        return navigation.navigate(NavigatorName.Base, {
          screen: name,
          params: {
            ...(options?.params || {}),
            account,
            parentAccount,
          },
        });
      }

      // open staking drawer (or stake flow screens) for the specific currency, inside the current navigator
      navigation.navigate(NavigatorName.Base, {
        screen: name,
        drawer: options?.drawer,
        params: {
          screen: options.screen,
          params: {
            ...(options?.params || {}),
            account,
            parentAccount,
          },
        },
      });
    },
    [alwaysShowNoFunds, parentRoute, navigation, entryPoint, walletState],
  );
}
