import { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  answerPredictionsOrder,
  predictionsOrderResultTone,
  usePredictionsOrderResult,
  type PredictionsOrderResult,
} from "@features/flow-predictions/native";
import type { StatusGradientTone } from "LLM/components/StatusGradient";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PredictionsOrderResult>
>;

export type PredictionsOrderResultViewModel = Readonly<{
  result: PredictionsOrderResult | null;
  tone: StatusGradientTone;
  handleClose: () => void;
  handleRetry: () => void;
}>;

export function usePredictionsOrderResultViewModel({
  navigation,
  route,
}: NavigationProps): PredictionsOrderResultViewModel {
  const { orderId } = route.params;
  const result = usePredictionsOrderResult(orderId);

  // Left any other way (Android back, a swipe, a reset): the live app still waits for an answer.
  useEffect(
    () => navigation.addListener("beforeRemove", () => answerPredictionsOrder(orderId, "close")),
    [navigation, orderId],
  );

  const handleClose = useCallback(() => {
    answerPredictionsOrder(orderId, "close");
    navigation.goBack();
  }, [navigation, orderId]);

  // The live app's player under this page also takes the Android back, for its webview history.
  // Added later while the page is in front, this one runs first.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        handleClose();
        return true;
      });
      return () => subscription.remove();
    }, [handleClose]),
  );

  const handleRetry = useCallback(() => {
    answerPredictionsOrder(orderId, "retry");
    navigation.goBack();
  }, [navigation, orderId]);

  return {
    result,
    tone: result ? predictionsOrderResultTone(result.report) : "info",
    handleClose,
    handleRetry,
  };
}
