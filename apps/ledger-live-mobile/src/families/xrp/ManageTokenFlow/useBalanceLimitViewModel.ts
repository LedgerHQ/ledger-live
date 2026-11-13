import { useCallback, useState } from "react";
import invariant from "invariant";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenBalanceLimit>
>;

export function useBalanceLimitViewModel({ navigation, route }: Props) {
  const { account: tokenAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount", "xrp: token account required");

  const { accountId, parentId, balanceLimit } = route.params;
  const { token } = tokenAccount;
  const unit = token.units[0];
  const maxLimit = getMaxTrustLimitForToken();

  const [isMaximum, setIsMaximum] = useState(balanceLimit.isMaximum);
  const [limitText, setLimitText] = useState(
    balanceLimit.isMaximum ? "" : balanceLimit.limit.shiftedBy(-unit.magnitude).toFixed(),
  );

  const typedLimit = parseCurrencyUnit(unit, limitText.replace(",", "."));
  const limit = isMaximum ? maxLimit : typedLimit;
  const hasTypedLimit = !isMaximum && limitText !== "";

  const onChangeLimitText = useCallback((text: string) => {
    setIsMaximum(false);
    setLimitText(text);
  }, []);

  const onClear = useCallback(() => onChangeLimitText(""), [onChangeLimitText]);

  const onSetMaximum = useCallback(() => {
    setIsMaximum(true);
    setLimitText("");
  }, []);

  const onConfirm = useCallback(() => {
    navigation.popTo(
      ScreenName.XrpManageTokenSettings,
      { accountId, parentId, balanceLimit: { limit, isMaximum } },
      { merge: true },
    );
  }, [accountId, isMaximum, limit, navigation, parentId]);

  return {
    token,
    isMaximum,
    limitText,
    onChangeLimitText,
    onClear,
    onSetMaximum,
    onConfirm,
    isLimitZero: hasTypedLimit && typedLimit.isZero(),
    isConfirmDisabled: !limit.gt(0),
  };
}
