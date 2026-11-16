import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
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

function removeMaximumText(text: string, maximumText: string) {
  return text.startsWith(maximumText) ? text.slice(maximumText.length) : "";
}

export function useBalanceLimitViewModel({ navigation, route }: Props) {
  const { account: tokenAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount", "xrp: token account required");

  const { accountId, parentId, balanceLimit } = route.params;
  const { token } = tokenAccount;
  const unit = token.units[0];
  const maxLimit = getMaxTrustLimitForToken();
  const maximumText = maxLimit.shiftedBy(-unit.magnitude).toExponential();

  const [isMaximum, setIsMaximum] = useState(balanceLimit.isMaximum);
  const [limitText, setLimitText] = useState(
    balanceLimit.isMaximum
      ? ""
      : new BigNumber(balanceLimit.limit).shiftedBy(-unit.magnitude).toFixed(),
  );

  const typedLimit = parseCurrencyUnit(unit, limitText.replace(",", "."));
  const limit = isMaximum ? maxLimit : typedLimit;
  const hasTypedLimit = !isMaximum && limitText !== "";

  const onChangeLimitText = useCallback(
    (text: string) => {
      setIsMaximum(false);
      setLimitText(isMaximum ? removeMaximumText(text, maximumText) : text);
    },
    [isMaximum, maximumText],
  );

  const onClear = useCallback(() => onChangeLimitText(""), [onChangeLimitText]);

  const onSetMaximum = useCallback(() => {
    setIsMaximum(true);
    setLimitText("");
  }, []);

  const onConfirm = useCallback(() => {
    navigation.popTo(
      ScreenName.XrpManageTokenSettings,
      { accountId, parentId, balanceLimit: { limit: limit.toFixed(), isMaximum } },
      { merge: true },
    );
  }, [accountId, isMaximum, limit, navigation, parentId]);

  return {
    token,
    isMaximum,
    onChangeLimitText,
    onClear,
    onSetMaximum,
    onConfirm,
    limitText: isMaximum ? maximumText : limitText,
    isLimitZero: hasTypedLimit && typedLimit.isZero(),
    isConfirmDisabled: !limit.gt(0),
  };
}
