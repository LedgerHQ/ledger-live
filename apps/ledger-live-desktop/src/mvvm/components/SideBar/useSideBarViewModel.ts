import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { sidebarCollapsedSelector } from "~/renderer/reducers/settings";
import { setTrackingSource, track } from "@shared/analytics";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { BAANX_APP_ID } from "~/renderer/screens/card/CardPlatformApp";
import { useSideBarAutoCollapse } from "./useSideBarAutoCollapse";
import {
  pathnameToActive,
  SIDEBAR_VALUE_TO_PATH,
  SIDEBAR_VALUE_TO_TRACK_ENTRY,
  isSideBarNavValue,
  getAccountsSidebarPath,
} from "./utils";
import { SCROLL_TO_TOP_EVENT } from "LLD/components/Page/constants";
import type { SideBarViewModel } from "./types";

export function useSideBarViewModel(): SideBarViewModel {
  const navigate = useNavigate();
  const location = useLocation();

  const earnLabel = useGetStakeLabelLocaleBased();
  const manifest = useRemoteLiveAppManifest(BAANX_APP_ID);
  const isCardDisabled = !manifest;

  const collapsed = useSelector(sidebarCollapsedSelector);
  const noAccounts = useSelector(accountsSelector).length === 0;

  const payTabFeature = useFeature("lwdPayTab");
  const isPayTabEnabled = !!payTabFeature?.enabled;

  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");
  const accountsSidebarPath = getAccountsSidebarPath(shouldDisplayAssetSection);

  const navRef = useRef<HTMLElement>(null);
  const handleCollapsedChange = useSideBarAutoCollapse(collapsed);

  useEffect(() => {
    const dropSideBarFocus = () => {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && navRef.current?.contains(focused)) {
        focused.blur();
      }
    };

    window.addEventListener("blur", dropSideBarFocus);
    return () => window.removeEventListener("blur", dropSideBarFocus);
  }, []);

  const push = useCallback(
    (pathname: string) => {
      if (location.pathname === pathname) return;
      setTrackingSource("sidebar");
      navigate(pathname);
    },
    [navigate, location.pathname],
  );

  const trackEntry = useCallback(
    (entry: string) => {
      track("menuentry_clicked", {
        entry,
        page: location.pathname,
        flagged: false,
      });
    },
    [location.pathname],
  );

  const handleScrollToTop = useCallback(() => {
    globalThis.dispatchEvent(new CustomEvent(SCROLL_TO_TOP_EVENT));
  }, []);

  const active = useMemo(
    () => pathnameToActive(location.pathname, shouldDisplayAssetSection, location.search),
    [location.pathname, shouldDisplayAssetSection, location.search],
  );

  const handleActiveChange = useCallback(
    (value: string) => {
      if (!isSideBarNavValue(value)) return;

      if (value === "home" && location.pathname === SIDEBAR_VALUE_TO_PATH.home) {
        handleScrollToTop();
      }
      const path = value === "accounts" ? accountsSidebarPath : SIDEBAR_VALUE_TO_PATH[value];
      push(path);
      trackEntry(SIDEBAR_VALUE_TO_TRACK_ENTRY[value]);
    },
    [handleScrollToTop, push, trackEntry, location.pathname, accountsSidebarPath],
  );

  return {
    navRef,
    collapsed,
    earnLabel,
    isCardDisabled,
    isPayTabEnabled,
    isAccountsDisabled: noAccounts,
    handleCollapsedChange,
    active,
    handleActiveChange,
  };
}
