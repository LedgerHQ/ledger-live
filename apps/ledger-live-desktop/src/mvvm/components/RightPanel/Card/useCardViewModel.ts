import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import useEnv from "@features/platform-env";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { useCountervalueFormatter } from "LLD/hooks/useCountervalueFormatter";
import { useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { HISTORY_TAB_CARD, HISTORY_TAB_SEARCH_PARAM } from "LLD/features/History/constants";
import { buildNavigationBackState } from "LLD/utils/navigationBackPath";
import { formatCardTransactionAmount } from "./formatCardTransactionAmount";
import { useCardHostedPageOpeners } from "./useCardHostedPageOpeners";
import { usePayCardAssets } from "./usePayCardAssets";
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
const CARD_TRANSACTION_DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

/** The provider app the redirect named, carried the same way as the code. */
function readCallbackAppId(state: unknown): string | undefined {
  if (typeof state !== "object" || state === null) {
    return undefined;
  }

  const appId = (state as { appId?: unknown }).appId;

  return typeof appId === "string" && appId !== "" ? appId : undefined;
}

export function useCardViewModel(): CardViewModel {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const locale = useSelector(localeSelector);
  const formatCountervalue = useCountervalueFormatter();

  const formatTransactionAmount = useCallback<
    NonNullable<CardViewModel["formatters"]["transactionAmount"]>
  >(
    (value, currency, kind) => formatCardTransactionAmount({ value, currency, kind, locale }),
    [locale],
  );
  const formatTransactionDate = useDateFormatter(CARD_TRANSACTION_DATE_FORMAT);

  const formatters = useMemo(
    () => ({
      countervalue: formatCountervalue,
      transactionAmount: formatTransactionAmount,
      transactionDate: formatTransactionDate,
    }),
    [formatCountervalue, formatTransactionAmount, formatTransactionDate],
  );

  // Read with `useEnv`, and not with `getEnv`: a tester sets these in the debug settings, and the
  // login must take the new values without a restart of the app.
  const apiUrl = useEnv("CARD_BAANX_API_URL");
  const clientId = useEnv("CARD_BAANX_CLIENT_KEY");
  const redirectUri = useEnv("CARD_OAUTH_REDIRECT_URI");

  // Baanx uses the same value for the client key header and the OAuth `client_id`.
  const oauthConfig: CardViewModel["login"]["oauthConfig"] = useMemo(
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
  // The app id names the provider tenant every later request has to reach.
  const callback: CardViewModel["login"]["callback"] = useMemo(() => {
    const code = readCallbackCode(state);
    const oauthState = readCallbackState(state);
    const appId = readCallbackAppId(state);

    return code
      ? { code, ...(oauthState ? { state: oauthState } : {}), ...(appId ? { appId } : {}) }
      : null;
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

  const login: CardViewModel["login"] = useMemo(
    () => ({ oauthConfig, callback, openHostedLogin, openHostedPage, onTrackEvent }),
    [oauthConfig, callback, openHostedLogin, openHostedPage, onTrackEvent],
  );

  const onShowMore = useCallback(() => {
    navigate(
      `/history?${HISTORY_TAB_SEARCH_PARAM}=${HISTORY_TAB_CARD}`,
      buildNavigationBackState("historyBackPath", pathname),
    );
  }, [navigate, pathname]);

  const onShowAssetHistory = useCallback<
    NonNullable<NonNullable<CardViewModel["assets"]>["onShowHistory"]>
  >(
    asset => {
      // Only the asset code travels: History resolves the display name from it, so the URL cannot
      // carry a name that contradicts the one the asset row shows.
      const searchParams = new URLSearchParams({
        [HISTORY_TAB_SEARCH_PARAM]: HISTORY_TAB_CARD,
        asset: asset.currency,
      });
      navigate(`/history?${searchParams}`, buildNavigationBackState("historyBackPath", pathname));
    },
    [navigate, pathname],
  );

  const payCardAssets = usePayCardAssets();
  const assets = useMemo(
    () => ({ ...payCardAssets, onShowHistory: onShowAssetHistory }),
    [onShowAssetHistory, payCardAssets],
  );

  return {
    formatters,
    assets,
    login,
    onShowMore,
  };
}
