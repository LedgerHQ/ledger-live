/* eslint-disable consistent-return */
import { useMemo, useLayoutEffect, useRef } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { listCryptoCurrencies } from "@ledgerhq/live-common/currencies/index";
import { filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import { NavigatorName, ScreenName } from "~/const";
import type { StackNavigatorProps, BaseComposite } from "../RootNavigator/types/helpers";
import type { StakeNavigatorParamList } from "../RootNavigator/types/StakeNavigator";

import { useStakingDrawer } from "./useStakingDrawer";
import { useStake } from "LLM/hooks/useStake/useStake";
import { useOpenStakeDrawer } from "LLM/features/Stake";

type Props = BaseComposite<StackNavigatorProps<StakeNavigatorParamList, ScreenName.Stake>>;

const StakeFlow = ({ route }: Props) => {
  const { enabledCurrencies, partnerSupportedAssets } = useStake();
  const currencies = route?.params?.currencies || enabledCurrencies.concat(partnerSupportedAssets);
  const navigation = useNavigation<StackNavigationProp<{ [key: string]: object | undefined }>>();
  const parentRoute = route?.params?.parentRoute;
  const account = route?.params?.account;
  const alwaysShowNoFunds = route?.params?.alwaysShowNoFunds;

  const cryptoCurrencies = useMemo(() => {
    return filterCurrencies(listCryptoCurrencies(), {
      currencies: currencies || [],
    });
  }, [currencies]);

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute,
    alwaysShowNoFunds,
    entryPoint: route?.params?.entryPoint,
  });

  const currency = cryptoCurrencies.length === 1 ? cryptoCurrencies[0] : undefined;
  const enabledCurrenciesForDrawer = cryptoCurrencies.map(c => c.id);

  const { handleOpenStakeDrawer, isModularDrawerEnabled } = useOpenStakeDrawer({
    currency,
    sourceScreenName: "stake_flow",
    enabledCurrencies: enabledCurrenciesForDrawer,
  });

  const requestAccountRef = useRef(() => {});

  requestAccountRef.current = () => {
    if (isModularDrawerEnabled) {
      handleOpenStakeDrawer();
      return;
    } else {
      // Fallback to traditional navigation
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
    }
  };

  useLayoutEffect(() => {
    if (account) {
      goToAccountStakeFlow(account);
    } else {
      requestAccountRef.current();
    }
  }, [goToAccountStakeFlow, account]);

  return null;
};

export default StakeFlow;
