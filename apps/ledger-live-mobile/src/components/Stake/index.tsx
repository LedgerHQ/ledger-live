/* eslint-disable consistent-return */
import { useMemo, useLayoutEffect, useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { NavigatorName, ScreenName } from "~/const";
import type { StackNavigatorProps, BaseComposite } from "../RootNavigator/types/helpers";
import type { StakeNavigatorParamList } from "../RootNavigator/types/StakeNavigator";

import { useStakingDrawer } from "./useStakingDrawer";

type Props = BaseComposite<StackNavigatorProps<StakeNavigatorParamList, ScreenName.Stake>>;

const StakeFlow = ({ route }: Props) => {
  const featureFlag = useFeature("stakePrograms");
  const currencies = route?.params?.currencies || featureFlag?.params?.list;
  const navigation = useNavigation<StackNavigationProp<{ [key: string]: object | undefined }>>();
  const parentRoute = route?.params?.parentRoute;
  const account = route?.params?.account;
  const alwaysShowNoFunds = route?.params?.alwaysShowNoFunds;

  const cryptoCurrencies = useMemo(() => {
    return filterCurrencies(listCurrencies(true), {
      currencies: currencies || [],
    });
  }, [currencies]);

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute,
    alwaysShowNoFunds,
    entryPoint: route.params.entryPoint,
  });

  const requestAccount = useCallback(() => {
    if (cryptoCurrencies.length === 1) {
      // Navigate to the second screen when there is only one currency
      navigation.replace(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectAccount,
        params: {
          currency: cryptoCurrencies[0],
          onSuccess: goToAccountStakeFlow,
          allowAddAccount: true, // if no account, need to be able to add one to get funds.
        },
      });
    } else {
      navigation.replace(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectCrypto,
        params: {
          currencies: cryptoCurrencies,
          allowAddAccount: true,
          onSuccess: goToAccountStakeFlow,
        },
      });
    }
  }, [cryptoCurrencies, navigation, goToAccountStakeFlow]);

  useLayoutEffect(() => {
    if (account) {
      goToAccountStakeFlow(account);
    } else {
      requestAccount();
    }
  }, [requestAccount, goToAccountStakeFlow, account]);

  return null;
};

export default StakeFlow;
