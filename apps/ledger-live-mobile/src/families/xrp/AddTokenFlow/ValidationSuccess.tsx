import React, { useCallback } from "react";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState } from "@shared/ui-info-state";
import PreventNativeBack from "~/components/PreventNativeBack";
import SafeAreaView from "~/components/SafeAreaView";
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
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { accountId } = route.params;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  return (
    <SafeAreaView isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="ValidationSuccess" />
      <PreventNativeBack />
      <SyncOneAccountOnMount
        reason="transaction-flow-confirmation"
        priority={10}
        accountId={accountId}
      />
      <InfoState
        preset="success"
        title={t("xrp.addToken.success.title")}
        description={t("xrp.addToken.success.text")}
        primaryCta={{
          label: t("xrp.addToken.success.cta"),
          onPress: onClose,
          testID: "xrp-add-token-success-close",
        }}
        testID="xrp-add-token-success"
      />
    </SafeAreaView>
  );
}
