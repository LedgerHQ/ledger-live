import React, { useCallback } from "react";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
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
import type { XrpManageTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { parentId, token, settings, result } = route.params;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, { accountId: parentId, operation: result });
  }, [navigation, parentId, result]);

  const limit = settings.isMaximum
    ? t("xrp.tokenSettings.maximum")
    : formatCurrencyUnit(token.units[0], settings.limit, { showCode: true });

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <TrackScreen category="XrpManageTokenFlow" name="ValidationSuccess" />
      <PreventNativeBack />
      <SyncOneAccountOnMount
        reason="transaction-flow-confirmation"
        priority={10}
        accountId={parentId}
      />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={t("xrp.tokenSettings.success.title")}
        description={t("xrp.tokenSettings.success.text", { limit })}
      />
    </Box>
  );
}
