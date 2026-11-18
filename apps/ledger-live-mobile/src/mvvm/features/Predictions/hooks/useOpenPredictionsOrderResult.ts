import { useEffect, useRef } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePredictionsOrderAwaitingResultPage } from "@features/flow-predictions/native";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";

/** Opens an order's result page once, from the live app that started the order, when it's in front. */
export function useOpenPredictionsOrderResult(ownsOrder: (orderId: number) => boolean) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const isFocused = useIsFocused();
  const orderId = usePredictionsOrderAwaitingResultPage();
  const openedOrderIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFocused || orderId === null || openedOrderIdRef.current === orderId) return;
    if (!ownsOrder(orderId)) return;
    openedOrderIdRef.current = orderId;
    navigation.navigate(ScreenName.PredictionsOrderResult, { orderId });
  }, [isFocused, navigation, orderId, ownsOrder]);
}
