import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useLocation, useHistory } from "react-router-dom";

import { accountsSelector } from "~/renderer/reducers/accounts";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";
import { usePostOnboardingDeeplinkHandler } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useRedirectToPostOnboardingCallback } from "../useAutoRedirectToPostOnboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

import { trackDeeplinkingEvent } from "./utils";
import { parseDeepLink, createRoute } from "./parseDeepLink";
import { executeHandler } from "./registry";
import { DeeplinkHandlerContext, NavigateFn } from "./types";

export function useDeepLinkHandler() {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const location = useLocation();
  const history = useHistory();

  const navigateToHome = useCallback(() => history.push("/"), [history]);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const postOnboardingDeeplinkHandler = usePostOnboardingDeeplinkHandler(
    navigateToHome,
    navigateToPostOnboardingHub,
  );
  const tryRedirectToPostOnboardingOrRecover = useRedirectToPostOnboardingCallback();

  const { openAddAccountFlow, openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "deeplink",
  );
  const openSendFlow = useOpenSendFlow();

  const navigate: NavigateFn = useCallback(
    (pathname: string, state?: { [k: string]: string | object }, search?: string) => {
      const hasNewPathname = pathname !== location.pathname;
      const hasNewSearch = typeof search === "string" && search !== location.search;
      const hasNewState = JSON.stringify(state) !== JSON.stringify(location.state);

      if (hasNewPathname || hasNewSearch) {
        setTrackingSource("deeplink");
        history.push({ pathname, state, search });
      } else if (!hasNewPathname && hasNewState) {
        setTrackingSource("deeplink");
        history.replace({ pathname, state, search });
      }
    },
    [history, location],
  );

  const context: DeeplinkHandlerContext = useMemo(
    () => ({
      dispatch,
      accounts,
      navigate,
      openAddAccountFlow,
      openAssetFlow,
      openSendFlow,
      postOnboardingDeeplinkHandler,
      tryRedirectToPostOnboardingOrRecover,
      currentPathname: location.pathname,
    }),
    [
      dispatch,
      accounts,
      navigate,
      openAddAccountFlow,
      openAssetFlow,
      openSendFlow,
      postOnboardingDeeplinkHandler,
      tryRedirectToPostOnboardingOrRecover,
      location.pathname,
    ],
  );

  const handler = useCallback(
    (_: unknown, deeplink: string) => {
      const parsed = parseDeepLink(deeplink);

      trackDeeplinkingEvent(parsed.tracking);

      const route = createRoute(parsed);

      executeHandler(route, context);
    },
    [context],
  );

  return { handler };
}
