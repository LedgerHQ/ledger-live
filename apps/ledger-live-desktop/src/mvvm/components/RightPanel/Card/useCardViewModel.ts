import { useCallback } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@features/flow-pay-card-details";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { CardViewModel } from "./types";

/** Mock card balance shown until the real balance API is wired (see LIVE-35427 follow-up). */
const MOCK_CARD_BALANCE = 100;

export function useCardViewModel(): CardViewModel {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const unit = counterValueCurrency.units[0];

  const formatCountervalue = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), { locale, showCode: true }),
    [unit, locale],
  );

  return {
    balance: MOCK_CARD_BALANCE,
    formatCountervalue,
    balanceLabel: t("payTab.card.balanceLabel"),
  };
}
