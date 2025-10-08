/* eslint-disable consistent-return */
import { useLayoutEffect, useRef } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
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
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const parentRoute = route?.params?.parentRoute;
  const account = route?.params?.account;
  const alwaysShowNoFunds = route?.params?.alwaysShowNoFunds;

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute,
    alwaysShowNoFunds,
    entryPoint: route?.params?.entryPoint,
  });

  const { handleOpenStakeDrawer, isModularDrawerEnabled } = useOpenStakeDrawer({
    currencies,
    sourceScreenName: "stake_flow",
  });

  const requestAccountRef = useRef(() => {});

  requestAccountRef.current = () => {
    if (isModularDrawerEnabled) {
      handleOpenStakeDrawer();
      return;
    } else {
      // Fallback to traditional navigation
      if (currencies.length === 1) {
        Promise.resolve(
          findCryptoCurrencyById(currencies[0]) ||
            getCryptoAssetsStore().findTokenById(currencies[0]),
        ).then(currency => {
          if (!currency) return;
          // Navigate to the second screen when there is only one currency
          navigation.replace(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectAccount,
            params: {
              currency,
              onSuccess: goToAccountStakeFlow,
              allowAddAccount: true, // if no account, need to be able to add one to get funds.
            },
          });
        });
      } else {
        navigation.replace(NavigatorName.RequestAccount, {
          screen: ScreenName.RequestAccountsSelectCrypto,
          params: {
            currencyIds: currencies,
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
