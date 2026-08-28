import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@features/flow-pay-card-details";
import { getEnv } from "@shared/env";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { CardViewModel } from "./types";

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

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardViewModel["oauthConfig"] = useMemo(
    () => ({
      apiUrl: getEnv("CARD_API_URL"),
      clientId: getEnv("CARD_BAANX_CLIENT_KEY"),
      // No `deepLink`: the user's own browser opens the page, and it reports nothing back (LIVE-34740).
      redirectUri: getEnv("CARD_OAUTH_REDIRECT_URI"),
    }),
    [],
  );

  return {
    title: t("payTab.card.title"),
    balanceLabel: t("payTab.card.balanceLabel"),
    formatCountervalue,
    oauthConfig,
  };
}
