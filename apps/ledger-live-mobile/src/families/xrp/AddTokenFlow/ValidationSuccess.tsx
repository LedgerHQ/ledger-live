import React, { useCallback } from "react";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
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
  const { accountId, token, result } = route.params;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, { accountId, operation: result });
  }, [accountId, navigation, result]);

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <TrackScreen category="XrpAddTokenFlow" name="ValidationSuccess" />
      <PreventNativeBack />
      <SyncOneAccountOnMount
        reason="transaction-flow-confirmation"
        priority={10}
        accountId={accountId}
      />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={t("xrp.addToken.success.title", { token: token.name })}
        description={t("xrp.addToken.success.text")}
      />
    </Box>
  );
}
