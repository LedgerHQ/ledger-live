import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

interface UsePortfolioBorrowSectionViewModelResult {
  onPress: () => void;
}

export const usePortfolioBorrowSectionViewModel = (): UsePortfolioBorrowSectionViewModelResult => {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: ScreenName.Portfolio,
    });

    navigation.navigate(NavigatorName.Borrow, { screen: ScreenName.Borrow, params: {} });
  }, [navigation]);

  return { onPress };
};
