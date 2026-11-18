import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { formatLimitText, parseLimitText, readLimitInput } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenBalanceLimit>
>;

function removeMaximumText(text: string, maximumText: string) {
  return text.startsWith(maximumText) ? text.slice(maximumText.length) : "";
}

export function useBalanceLimitViewModel({ navigation, route }: Props) {
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
      : formatCurrencyUnit(unit, new BigNumber(balanceLimit.limit), {
          locale,
          disableRounding: true,
        }),
  );

  const typedLimit = parseLimitText(unit, limitText, locale);
  const limit = isMaximum ? MAX_TRUST_LIMIT : typedLimit;
  const hasTypedLimit = !isMaximum && limitText !== "";
  const inputText = hasTypedLimit ? `${limitText} ${token.ticker}` : "";

  const onChangeLimitText = useCallback(
    (text: string) => {
      setIsMaximum(false);
      const typedText = isMaximum
        ? removeMaximumText(text, maximumText)
        : readLimitInput(text, limitText, token.ticker);
      setLimitText(formatLimitText(typedText, locale));
    },
    [isMaximum, limitText, locale, maximumText, token.ticker],
  );

  const onClear = useCallback(() => {
    setIsMaximum(false);
    setLimitText("");
  }, []);

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
      balance: formatCurrencyUnit(unit, tokenAccount.balance, { showCode: true }),
    });
  })();

  return {
    token,
    isMaximum,
    onChangeLimitText,
    onClear,
    onSetMaximum,
    onConfirm,
    errorText,
    inputText: isMaximum ? maximumText : inputText,
    isConfirmDisabled: !isLimitPositive || isBelowBalance,
  };
}
