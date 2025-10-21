import { useCallback } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useModularDrawerController, useModularDrawerVisibility } from "../ModularDrawer";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import { useDrawerConfiguration } from "@ledgerhq/live-common/dada-client/hooks/useDrawerConfiguration";
import { useStakingDrawer } from "~/components/Stake/useStakingDrawer";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  enabledCurrencies?: string[];
  partnerSupportedAssets?: string[];
};

export function useOpenStakeDrawer({
  currency,
  sourceScreenName,
  enabledCurrencies = [],
  partnerSupportedAssets = [],
}: Props) {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<BaseNavigatorStackParamList>>();
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
      const currencies = currency
        ? [currency.id]
        : enabledCurrencies.concat(partnerSupportedAssets);
      const cryptoCurrencies = filterCurrencies(listCurrencies(true), {
        currencies: currencies || [],
      });

      const finalDrawerConfiguration = createDrawerConfiguration(undefined, "earn");
      return openDrawer({
        currencies: cryptoCurrencies.map(c => c.id),
        flow: "stake",
        source: sourceScreenName,
        enableAccountSelection: true,
        onAccountSelected: goToAccountStakeFlow,
        useCase: "earn",
        ...(currency && { areCurrenciesFiltered: true }),
        ...(finalDrawerConfiguration.assets && {
          assetsConfiguration: finalDrawerConfiguration.assets,
        }),
        ...(finalDrawerConfiguration.networks && {
          networksConfiguration: finalDrawerConfiguration.networks,
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
    partnerSupportedAssets,
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
