/* eslint-disable consistent-return */
import { useMemo, useLayoutEffect, useRef } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import { NavigatorName, ScreenName } from "~/const";
import type { StackNavigatorProps, BaseComposite } from "../RootNavigator/types/helpers";
import type { StakeNavigatorParamList } from "../RootNavigator/types/StakeNavigator";
import {
  ModularDrawerLocation,
  useModularDrawerController,
  useModularDrawerVisibility,
} from "LLM/features/ModularDrawer";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { useStakingDrawer } from "./useStakingDrawer";
import { useStake } from "LLM/hooks/useStake/useStake";

type Props = BaseComposite<StackNavigatorProps<StakeNavigatorParamList, ScreenName.Stake>>;

const StakeFlow = ({ route }: Props) => {
  const { enabledCurrencies, partnerSupportedAssets } = useStake();
  const currencies = route?.params?.currencies || enabledCurrencies.concat(partnerSupportedAssets);
  const navigation = useNavigation<StackNavigationProp<{ [key: string]: object | undefined }>>();
  const parentRoute = route?.params?.parentRoute;
  const account = route?.params?.account;
  const alwaysShowNoFunds = route?.params?.alwaysShowNoFunds;

  // Modular drawer integration
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });
  const modularDrawerVisible = isModularDrawerVisible({
    location: ModularDrawerLocation.LIVE_APP,
    liveAppId: "earn",
  });
  const { openDrawer } = useModularDrawerController();

  // Feature flag for earn drawer configuration
  const earnDrawerApyFlag = useFeature("ptxEarnDrawerApy");

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

  const requestAccountRef = useRef(() => {});

  requestAccountRef.current = () => {
    if (modularDrawerVisible) {
      const earnDrawerConfiguration = earnDrawerApyFlag?.enabled ? earnDrawerApyFlag.params : {};
      openDrawer({
        currencies: cryptoCurrencies.map(c => c.id),
        flow: "stake",
        source: "stake_flow",
        enableAccountSelection: true,
        onAccountSelected: goToAccountStakeFlow,
        useCase: "earn",
        ...earnDrawerConfiguration,
      });
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
  }, [account, goToAccountStakeFlow]);

  return null;
};

export default StakeFlow;
