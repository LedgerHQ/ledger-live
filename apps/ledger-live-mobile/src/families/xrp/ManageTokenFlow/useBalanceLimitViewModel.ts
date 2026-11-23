import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import type { XrpManageTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenBalanceLimit>
>;

function removeMaximumText(text: string, maximumText: string) {
  return text.startsWith(maximumText) ? text.slice(maximumText.length) : "";
}

// The decimal-pad keyboard follows the phone region: either "," or "." is the decimal point.
// Several separators mean a grouped number such as "1,234,567", which has no safe reading.
function toLimitText(text: string, magnitude: number) {
  const parts = text
    .replaceAll(",", ".")
    .replace(/[^\d.]/g, "")
    .split(".");
  if (parts.length > 2) return undefined;

  const [integer = "", fraction] = parts;
  if (fraction === undefined || magnitude === 0) return integer;

  return `${integer}.${fraction.slice(0, magnitude)}`;
}

export function useBalanceLimitViewModel() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { account: tokenAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount", "xrp: token account required");

  const { accountId, parentId, balanceLimit } = route.params;
  const { token } = tokenAccount;
  const unit = token.units[0];
  const maximumText = t("xrp.tokenSettings.maximum");

  const [isMaximum, setIsMaximum] = useState(balanceLimit.isMaximum);
  const [limitText, setLimitText] = useState(
    balanceLimit.isMaximum
      ? ""
      : new BigNumber(balanceLimit.limit).shiftedBy(-unit.magnitude).toFixed(),
  );

  const typedLimit = parseCurrencyUnit(unit, limitText);
  const limit = isMaximum ? MAX_TRUST_LIMIT : typedLimit;
  const hasTypedLimit = !isMaximum && limitText !== "";

  const onChangeLimitText = useCallback(
    (text: string) => {
      const typedText = isMaximum ? removeMaximumText(text, maximumText) : text;
      const nextLimitText = toLimitText(typedText, unit.magnitude);
      if (nextLimitText === undefined) return;

      setIsMaximum(false);
      setLimitText(nextLimitText);
    },
    [isMaximum, maximumText, unit.magnitude],
  );

  const onSetMaximum = useCallback(() => {
    setIsMaximum(true);
    setLimitText("");
  }, []);

  const onConfirm = useCallback(() => {
    navigation.popTo(
      ScreenName.XrpManageTokenSettings,
      {
        accountId,
        parentId,
        balanceLimit: { limit: limit.toFixed(), isMaximum },
      },
      { merge: true },
    );
  }, [accountId, isMaximum, limit, navigation, parentId]);

  const isLimitZero = hasTypedLimit && typedLimit.isZero();
  const isLimitPositive = limit.gt(0);
  const isCustomLimit = !isMaximum && isLimitPositive;
  const isBelowBalance = isCustomLimit && limit.lt(tokenAccount.balance);

  const errorText = (() => {
    if (isLimitZero) return t("errors.XrpTrustLimitZero.title");
    if (!isBelowBalance) return undefined;

    return t("xrp.tokenSettings.limitBelowBalance", {
      balance: formatCurrencyUnit(unit, tokenAccount.balance, { showCode: true, locale }),
    });
  })();

  return {
    token,
    isMaximum,
    onChangeLimitText,
    onSetMaximum,
    onConfirm,
    errorText,
    inputText: isMaximum ? maximumText : limitText,
    isConfirmDisabled: !isLimitPositive || isBelowBalance,
  };
}
