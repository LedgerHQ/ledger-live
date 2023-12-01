import { useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import perFamilyAccountActions from "../../generated/accountActions";

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
  return useCallback(
    (account: Account, parentAccount?: Account) => {
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

      // @ts-expect-error issue in typing
      const decorators = perFamilyAccountActions[account?.currency?.family];
      // get the stake flow for the specific currency
      const familySpecificMainActions =
        (decorators &&
          decorators.getMainActions &&
          decorators.getMainActions({
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
    [alwaysShowNoFunds, parentRoute, navigation, entryPoint],
  );
}
