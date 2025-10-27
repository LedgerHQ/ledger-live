import { useCallback } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useModularDrawerController, useModularDrawerVisibility } from "../ModularDrawer";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";
import { useDrawerConfiguration } from "@ledgerhq/live-common/dada-client/hooks/useDrawerConfiguration";
import { useStakingDrawer } from "~/components/Stake/useStakingDrawer";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  enabledCurrencies?: string[];
};

export function useOpenStakeDrawer({ currency, sourceScreenName, enabledCurrencies = [] }: Props) {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openDrawer } = useModularDrawerController();
  const { createDrawerConfiguration } = useDrawerConfiguration();

  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const isModularDrawerEnabled = isModularDrawerVisible({
    location: ModularDrawerLocation.LIVE_APP,
    liveAppId: "earn",
  });

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  const handleOpenStakeDrawer = useCallback(() => {
    if (isModularDrawerEnabled) {
      const stakeDrawerConfiguration = createDrawerConfiguration(undefined, "earn");
      const currencies = currency ? [currency.id] : enabledCurrencies;
      return openDrawer({
        currencies,
        areCurrenciesFiltered: currencies?.length > 0,
        flow: "stake",
        source: sourceScreenName,
        enableAccountSelection: true,
        onAccountSelected: goToAccountStakeFlow,
        useCase: "earn",
        ...(stakeDrawerConfiguration.assets && {
          assetsConfiguration: stakeDrawerConfiguration.assets,
        }),
        ...(stakeDrawerConfiguration.networks && {
          networksConfiguration: stakeDrawerConfiguration.networks,
        }),
      });
    } else {
      // Fallback to traditional navigation
      return navigation.navigate(NavigatorName.StakeFlow, {
        screen: ScreenName.Stake,
        params: {
          currencies: currency ? [currency.id] : undefined,
          parentRoute: route,
        },
      });
    }
  }, [
    isModularDrawerEnabled,
    currency,
    enabledCurrencies,
    createDrawerConfiguration,
    openDrawer,
    sourceScreenName,
    goToAccountStakeFlow,
    navigation,
    route,
  ]);

  return {
    handleOpenStakeDrawer,
    isModularDrawerEnabled,
  };
}
