import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useDeviceHasUpdatesAvailable } from "@ledgerhq/live-common/manager/useDeviceHasUpdatesAvailable";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { accountsSelector, starredAccountsSelector } from "~/renderer/reducers/accounts";
import { sidebarCollapsedSelector, lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { isNavigationLocked } from "~/renderer/reducers/application";
import { openModal } from "~/renderer/actions/modals";
import { setSidebarCollapsed } from "~/renderer/actions/settings";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { HIDE_BAR_THRESHOLD } from "~/renderer/screens/dashboard/AssetDistribution/constants";
import { BAANX_APP_ID } from "~/renderer/screens/card/CardPlatformApp";
import {
  pathnameToActive,
  SIDEBAR_VALUE_TO_PATH,
  SIDEBAR_VALUE_TO_TRACK_ENTRY,
  SIDEBAR_SPECIAL_VALUES,
  isSideBarNavValue,
} from "./utils";
import type { SideBarViewModel } from "./types";

const MAX_STARRED_ACCOUNTS_DISPLAYED_IN_SMALL_SCREEN = 3;
const STARRED_ACCOUNT_ITEM_HEIGHT = 55;

/** Registry for sidebar entries that only do push(path) + trackEntry(entry). */
const SIDEBAR_NAV_REGISTRY = {
  handleClickDashboard: { path: SIDEBAR_VALUE_TO_PATH.home, trackEntry: "/portfolio" },
  handleClickAccounts: { path: SIDEBAR_VALUE_TO_PATH.accounts, trackEntry: "accounts" },
  handleClickCatalog: { path: SIDEBAR_VALUE_TO_PATH.discover, trackEntry: "platform" },
  handleClickEarn: { path: SIDEBAR_VALUE_TO_PATH.earn, trackEntry: "earn" },
  handleClickSwap: { path: SIDEBAR_VALUE_TO_PATH.swap, trackEntry: "swap" },
  handleClickCardWallet: { path: SIDEBAR_VALUE_TO_PATH.card, trackEntry: "card" },
  // Legacy-only entries (not in Wallet 4.0 sidebar)
  handleClickMarket: { path: "/market", trackEntry: "market" },
  handleClickManager: { path: "/manager", trackEntry: "manager" },
  handleClickExchange: { path: "/exchange", trackEntry: "exchange" },
  handleClickPerps: { path: "/perps", trackEntry: "perps" },
  handleClickCard: { path: "/card", trackEntry: "card" },
} as const;

type NavHandlerKey = keyof typeof SIDEBAR_NAV_REGISTRY;

const checkLiveAppTabSelection = (pathname: string, liveAppPaths: ReadonlyArray<string>): boolean =>
  liveAppPaths.some((liveTab: string) => pathname?.includes(liveTab));

function createNavHandlers(
  push: (path: string) => void,
  trackEntry: (entry: string, flagged?: boolean) => void,
): Record<NavHandlerKey, () => void> {
  const registry = SIDEBAR_NAV_REGISTRY;
  return {
    handleClickDashboard: () => {
      push(registry.handleClickDashboard.path);
      trackEntry(registry.handleClickDashboard.trackEntry);
    },
    handleClickMarket: () => {
      push(registry.handleClickMarket.path);
      trackEntry(registry.handleClickMarket.trackEntry);
    },
    handleClickManager: () => {
      push(registry.handleClickManager.path);
      trackEntry(registry.handleClickManager.trackEntry);
    },
    handleClickAccounts: () => {
      push(registry.handleClickAccounts.path);
      trackEntry(registry.handleClickAccounts.trackEntry);
    },
    handleClickCatalog: () => {
      push(registry.handleClickCatalog.path);
      trackEntry(registry.handleClickCatalog.trackEntry);
    },
    handleClickExchange: () => {
      push(registry.handleClickExchange.path);
      trackEntry(registry.handleClickExchange.trackEntry);
    },
    handleClickEarn: () => {
      push(registry.handleClickEarn.path);
      trackEntry(registry.handleClickEarn.trackEntry);
    },
    handleClickSwap: () => {
      push(registry.handleClickSwap.path);
      trackEntry(registry.handleClickSwap.trackEntry);
    },
    handleClickPerps: () => {
      push(registry.handleClickPerps.path);
      trackEntry(registry.handleClickPerps.trackEntry);
    },
    handleClickCard: () => {
      push(registry.handleClickCard.path);
      trackEntry(registry.handleClickCard.trackEntry);
    },
    handleClickCardWallet: () => {
      push(registry.handleClickCardWallet.path);
      trackEntry(registry.handleClickCardWallet.trackEntry);
    },
  };
}

export function useSideBarViewModel(): SideBarViewModel {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const earnLabel = useGetStakeLabelLocaleBased();
  const manifest = useRemoteLiveAppManifest(BAANX_APP_ID);
  const isCardDisabled = !manifest;

  const navigationLocked = useSelector(isNavigationLocked);
  const collapsed = useSelector(sidebarCollapsedSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const noAccounts = useSelector(accountsSelector).length === 0;
  const totalStarredAccounts = useSelector(starredAccountsSelector).length;
  const displayBlueDot = useDeviceHasUpdatesAvailable(lastSeenDevice);

  const referralProgramConfig = useFeature("referralProgramDesktopSidebar");
  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);

  const {
    shouldDisplayMarketBanner: isMarketBannerEnabled,
    shouldDisplayQuickActionCtas: isQuickActionCtasEnabled,
    shouldDisplayWallet40MainNav: isWallet40MainNavEnabled,
    isEnabled: isWallet40Enabled,
  } = useWalletFeaturesConfig("desktop");

  const wasNarrowRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isWallet40Enabled) return;

    const handleResize = () => {
      const isNarrow = window.innerWidth <= HIDE_BAR_THRESHOLD;

      if (wasNarrowRef.current !== isNarrow) {
        wasNarrowRef.current = isNarrow;
        if (isNarrow) {
          dispatch(setSidebarCollapsed(true));
        }
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isWallet40Enabled, dispatch]);

  const handleCollapsedChange = useCallback(
    (newCollapsed: boolean) => {
      dispatch(setSidebarCollapsed(newCollapsed));
    },
    [dispatch],
  );

  // Legacy Main SideBar collapse handler
  const handleCollapse = useCallback(() => {
    handleCollapsedChange(!collapsed);
  }, [handleCollapsedChange, collapsed]);

  const push = useCallback(
    (pathname: string) => {
      if (location.pathname === pathname) return;
      setTrackingSource("sidebar");
      navigate(pathname);
    },
    [navigate, location.pathname],
  );

  const trackEntry = useCallback(
    (entry: string, flagged = false) => {
      track("menuentry_clicked", {
        entry,
        page: location.pathname,
        flagged,
      });
    },
    [location.pathname],
  );

  const navHandlers = useMemo(() => createNavHandlers(push, trackEntry), [push, trackEntry]);

  const openSendFlow = useOpenSendFlow();

  const handleClickRefer = useCallback(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      push(referralProgramConfig.params.path);
      trackEntry("refer-a-friend", referralProgramConfig?.params?.isNew);
    }
  }, [push, referralProgramConfig, trackEntry]);

  const maybeRedirectToAccounts = useCallback(() => {
    return location.pathname === "/manager" && push("/accounts");
  }, [location.pathname, push]);

  const handleOpenSendModal = useCallback(() => {
    maybeRedirectToAccounts();
    openSendFlow();
  }, [maybeRedirectToAccounts, openSendFlow]);

  const handleOpenReceiveModal = useCallback(() => {
    maybeRedirectToAccounts();
    dispatch(openModal("MODAL_RECEIVE", undefined));
  }, [dispatch, maybeRedirectToAccounts]);

  const handleClickRecover = useCallback(() => {
    const enabled = recoverFeature?.enabled;
    const openRecoverFromSidebar = recoverFeature?.params?.openRecoverFromSidebar;
    const liveAppId = recoverFeature?.params?.protectId;

    if (enabled && openRecoverFromSidebar && liveAppId && recoverHomePath) {
      navigate(recoverHomePath);
    } else if (enabled) {
      dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
    }
    track("button_clicked2", {
      button: "Protect",
    });
  }, [
    recoverFeature?.enabled,
    recoverFeature?.params?.openRecoverFromSidebar,
    recoverFeature?.params?.protectId,
    recoverHomePath,
    navigate,
    dispatch,
  ]);

  const liveAppPaths = [referralProgramConfig?.params?.path].filter(
    (path): path is string => !!path,
  );

  const isLiveAppTabSelected = checkLiveAppTabSelection(location.pathname, liveAppPaths);

  const getMinHeightForStarredAccountsList = useCallback(() => {
    if (totalStarredAccounts === 0) {
      return "max-content";
    }

    const minHeight =
      Math.min(totalStarredAccounts, MAX_STARRED_ACCOUNTS_DISPLAYED_IN_SMALL_SCREEN) *
      STARRED_ACCOUNT_ITEM_HEIGHT;

    return `${minHeight}px`;
  }, [totalStarredAccounts]);

  const active = useMemo(
    () => pathnameToActive(location.pathname, referralProgramConfig?.params?.path),
    [location.pathname, referralProgramConfig?.params?.path],
  );

  const handleActiveChange = useCallback(
    (value: string) => {
      if (value === SIDEBAR_SPECIAL_VALUES.refer) {
        handleClickRefer();
        return;
      }
      if (value === SIDEBAR_SPECIAL_VALUES.recover) {
        handleClickRecover();
        return;
      }
      if (isSideBarNavValue(value)) {
        push(SIDEBAR_VALUE_TO_PATH[value]);
        trackEntry(SIDEBAR_VALUE_TO_TRACK_ENTRY[value]);
      }
    },
    [handleClickRefer, handleClickRecover, push, trackEntry],
  );

  return {
    pathname: location.pathname,
    location,
    collapsed,
    navigationLocked,
    noAccounts,
    totalStarredAccounts,
    displayBlueDot,
    earnLabel,
    isCardDisabled,
    isLiveAppTabSelected,
    isMarketBannerEnabled,
    isQuickActionCtasEnabled,
    isWallet40MainNavEnabled,
    referralProgramConfig,
    recoverFeature,
    recoverHomePath,
    getMinHeightForStarredAccountsList,
    handleCollapse,
    handleCollapsedChange,
    push,
    trackEntry,
    ...navHandlers,
    handleClickRefer,
    handleClickRecover,
    handleOpenSendModal,
    handleOpenReceiveModal,
    active,
    handleActiveChange,
  };
}
