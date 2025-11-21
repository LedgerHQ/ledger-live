import { useCallback } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useModularDrawerController } from "../ModularDrawer";
import { useDrawerConfiguration } from "@ledgerhq/live-common/dada-client/hooks/useDrawerConfiguration";
import { useStakingDrawer } from "~/components/Stake/useStakingDrawer";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = {
  sourceScreenName: string;
  currencies?: string[];
};

export function useOpenStakeDrawer({ sourceScreenName, currencies }: Props) {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openDrawer } = useModularDrawerController();
  const { createDrawerConfiguration } = useDrawerConfiguration();

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  const handleOpenStakeDrawer = useCallback(() => {
    const stakeDrawerConfiguration = createDrawerConfiguration(undefined, "earn");
    return openDrawer({
      currencies,
      areCurrenciesFiltered: currencies && currencies.length > 0,
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
  }, [createDrawerConfiguration, openDrawer, currencies, sourceScreenName, goToAccountStakeFlow]);

  return {
    handleOpenStakeDrawer,
  };
}
