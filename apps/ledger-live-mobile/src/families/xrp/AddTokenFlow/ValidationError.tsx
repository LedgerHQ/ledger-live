import React, { useCallback } from "react";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import ValidateError from "~/components/ValidateError";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { XrpAddTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onRetry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="ValidationError" />
      <ValidateError error={route.params.error} onRetry={onRetry} onClose={onClose} />
    </SafeAreaView>
  );
}
