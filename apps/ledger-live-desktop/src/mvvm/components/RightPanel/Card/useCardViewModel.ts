import { useCallback, useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@features/flow-pay-card-details";
import useEnv from "@features/platform-env";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { useCardHostedPageOpeners } from "./useCardHostedPageOpeners";
import { useWipeHostedSessionOnSignInChange } from "./useWipeHostedSession";
import type { CardViewModel } from "./types";

/** The shape `payTabHandler` navigates with once the Card login redirect carried a code. */
function readCallbackCode(state: unknown): string | undefined {
  if (typeof state !== "object" || state === null) {
    return undefined;
  }

  const code = (state as { code?: unknown }).code;

  return typeof code === "string" && code !== "" ? code : undefined;
}

/** The attempt id the redirect echoed back, carried the same way as the code. */
function readCallbackState(state: unknown): string | undefined {
  if (typeof state !== "object" || state === null) {
    return undefined;
  }

  const oauthState = (state as { state?: unknown }).state;

  return typeof oauthState === "string" && oauthState !== "" ? oauthState : undefined;
}

export function useCardViewModel(): CardViewModel {
  const { t } = useTranslation();
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
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
  const apiUrl = useEnv("CARD_BAANX_API_URL");
  const clientId = useEnv("CARD_BAANX_CLIENT_KEY");
  const redirectUri = useEnv("CARD_OAUTH_REDIRECT_URI");

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardViewModel["oauthConfig"] = useMemo(
    () => ({
      apiUrl,
      clientId,
      // No `hostedUiUrl`: the manifest of the live app carries the base of every hosted page.
      // No `deepLink`: the Discover webview has no secure-browser-session API to close it with.
      redirectUri,
    }),
    [apiUrl, clientId, redirectUri],
  );

  // The code is what the exchange needs: PKCE ties it to the verifier the attempt store still holds.
  // The state, when the redirect carried one, only lets the flow recognize its own attempt's redirect.
  const callback: CardViewModel["callback"] = useMemo(() => {
    const code = readCallbackCode(state);
    const oauthState = readCallbackState(state);

    return code ? { code, ...(oauthState ? { state: oauthState } : {}) } : null;
  }, [state]);

  useEffect(() => {
    // The flow only reads this on mount. Left on the history entry, it would replay into a later
    // remount — e.g. a logout brings CardLogin back, hydrates with no attempt on disk, and the
    // stale code alone is read as a redirect for a login that never started.
    if (callback) {
      navigate(pathname, { replace: true, state: null });
    }
  }, [callback, navigate, pathname]);

  const { openHostedLogin, openHostedPage } = useCardHostedPageOpeners();

  useWipeHostedSessionOnSignInChange();

  const onTrackEvent = useCallback((event: string, params: Record<string, unknown>) => {
    track(event, params);
  }, []);

  return {
    title: t("payTab.card.title"),
    balanceLabel: t("payTab.card.balanceLabel"),
    formatCountervalue,
    oauthConfig,
    callback,
    openHostedLogin,
    openHostedPage,
    onTrackEvent,
  };
}
