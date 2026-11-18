import React, { useCallback, useEffect } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { applyTrustLineEdit } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { accountId, parentId, transaction, result } = route.params;

  // A sync right now would read the ledger before it validates the edit: show the signed values instead
  useEffect(() => {
    const edit = { limit: transaction.amount, isRippling: !transaction.noRipple };
    dispatch(
      updateAccountWithUpdater({
        accountId: parentId,
        updater: account => applyTrustLineEdit(account, accountId, edit),
      }),
    );
  }, [accountId, dispatch, parentId, transaction]);

  const onClose = useCallback(() => {
    navigation.popTo(ScreenName.XrpManageTokenList, { accountId: parentId });
  }, [navigation, parentId]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, { accountId: parentId, operation: result });
  }, [navigation, parentId, result]);

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <TrackScreen category="XrpManageTokenFlow" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={t("xrp.tokenSettings.success.title")}
      />
    </Box>
  );
}
