import React, { useCallback } from "react";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState } from "@shared/ui-info-state";
import SafeAreaView from "~/components/SafeAreaView";
import TranslatedError from "~/components/TranslatedError";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import type { XrpAddTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { error } = route.params;
  const isSigned = error.name === "TransactionBroadcastError";

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onRetry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="ValidationError" />
      <InfoState
        preset="error"
        title={t("xrp.addToken.error.title")}
        description={<TranslatedError error={error} />}
        banner={
          isSigned
            ? {
                appearance: "warning",
                description: t("xrp.tokenSettings.error.broadcastError"),
                testID: "xrp-add-token-broadcast-error",
              }
            : undefined
        }
        primaryCta={{
          label: t("common.tryAgain"),
          onPress: onRetry,
          testID: "xrp-add-token-retry",
        }}
        secondaryCta={{
          label: t("common.close"),
          onPress: onClose,
          testID: "xrp-add-token-close",
        }}
        testID="xrp-add-token-error"
      />
    </SafeAreaView>
  );
}
