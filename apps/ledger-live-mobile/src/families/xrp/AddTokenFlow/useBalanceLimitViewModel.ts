import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { formatLimitText, parseLimitText, readLimitInput } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenBalanceLimit>
>;

function removeMaximumText(text: string, maximumText: string) {
  return text.startsWith(maximumText) ? text.slice(maximumText.length) : "";
}

export function useBalanceLimitViewModel({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const { accountId, token, balanceLimit } = route.params;
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
      ScreenName.XrpAddTokenReview,
      {
        accountId,
        token,
        balanceLimit: { limit: limit.toFixed(), isMaximum },
      },
      { merge: true },
    );
  }, [accountId, isMaximum, limit, navigation, token]);

  const isLimitZero = hasTypedLimit && typedLimit.isZero();

  return {
    isMaximum,
    onChangeLimitText,
    onClear,
    onSetMaximum,
    onConfirm,
    errorText: isLimitZero ? t("errors.XrpTrustLimitZero.title") : undefined,
    inputText: isMaximum ? maximumText : inputText,
    isConfirmDisabled: !limit.gt(0),
  };
}
