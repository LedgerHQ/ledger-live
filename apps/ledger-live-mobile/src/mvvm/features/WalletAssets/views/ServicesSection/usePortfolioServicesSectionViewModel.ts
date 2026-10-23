import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ServiceEntryPointId } from "@features/flow-portfolio-services-entry-points";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

interface UsePortfolioServicesSectionViewModelResult {
  onOpenService: (service: ServiceEntryPointId) => void;
}

export function usePortfolioServicesSectionViewModel(): UsePortfolioServicesSectionViewModelResult {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const onOpenService = useCallback(
    function onOpenService(service: ServiceEntryPointId) {
      switch (service) {
        case "perps":
          navigation.navigate(NavigatorName.Perps, { screen: ScreenName.PerpsTab });
          return;
        case "borrow":
          navigation.navigate(NavigatorName.Borrow, { screen: ScreenName.Borrow, params: {} });
          return;
      }
    },
    [navigation],
  );

  return { onOpenService };
}
