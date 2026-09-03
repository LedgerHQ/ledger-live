import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@features/flow-pay-card-details";
import useEnv from "@features/platform-env";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
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

  // Read with `useEnv`, and not with `getEnv`: a tester sets these in the debug settings, and the
  // login must take the new values without a restart of the app.
  const apiUrl = useEnv("CARD_API_URL");
  const clientId = useEnv("CARD_BAANX_CLIENT_KEY");
  const hostedUiUrl = useEnv("CARD_BAANX_HOSTED_UI");
  const redirectUri = useEnv("CARD_OAUTH_REDIRECT_URI");

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardViewModel["oauthConfig"] = useMemo(
    () => ({
      apiUrl,
      clientId,
      hostedUiUrl,
      // No `deepLink`: the user's own browser opens the page, and it reports nothing back (LIVE-34740).
      redirectUri,
    }),
    [apiUrl, clientId, hostedUiUrl, redirectUri],
  );

  const onTrackEvent = useCallback((event: string, params: Record<string, unknown>) => {
    track(event, params);
  }, []);

  return {
    title: t("payTab.card.title"),
    balanceLabel: t("payTab.card.balanceLabel"),
    formatCountervalue,
    oauthConfig,
    onTrackEvent,
  };
}
