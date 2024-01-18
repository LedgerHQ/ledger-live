import {
  INITIAL_PLATFORM_STATE,
  DAPP_DISCLAIMER_ID,
  BROWSE_SEARCH_OPTIONS,
  DISCOVER_STORE_KEY,
} from "@ledgerhq/live-common/wallet-api/constants";
import {
  useDisclaimerRaw,
  useCategories,
  useRecentlyUsed,
  RecentlyUsedDB,
  DisclaimerRaw,
} from "@ledgerhq/live-common/wallet-api/react";
import { SearchRaw, useSearch } from "@ledgerhq/live-common/hooks/useSearch";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useDispatch, useSelector } from "react-redux";
import { useDB } from "~/renderer/storage";
import { dismissedBannersSelector } from "~/renderer/reducers/settings";
import { dismissBanner } from "~/renderer/actions/settings";
import { useCallback, useMemo } from "react";
import { useHistory } from "react-router";
import { closePlatformAppDrawer, openPlatformAppDisclaimerDrawer } from "~/renderer/actions/UI";
import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

export function useCatalog(db: RecentlyUsedDB) {
  const completeManifests = useManifests({ visibility: ["complete"] });
  const combinedManifests = useManifests({ visibility: ["searchable", "complete"] });
  const categories = useCategories(completeManifests);
  const recentlyUsed = useRecentlyUsed(combinedManifests, db);

  const search = useSearch({
    list: combinedManifests,
    options: BROWSE_SEARCH_OPTIONS,
    filter: (item: AppManifest, input: string) => {
      if (input) return true;
      return (
        item.visibility === "complete" &&
        (item.categories.includes(categories.selected) || categories.selected === "all")
      );
    },
  });
  const disclaimer = useDisclaimer(recentlyUsed.append);

  return {
    categories,
    recentlyUsed,
    disclaimer,
    search,
  };
}

export function useDiscoverDB() {
  return useDB("app", DISCOVER_STORE_KEY, INITIAL_PLATFORM_STATE, state => state.recentlyUsed);
}

export type Disclaimer = DisclaimerRaw;

export function useDisclaimer(appendRecentlyUsed: (manifest: AppManifest) => void): DisclaimerRaw {
  const [isDismissed, dismiss] = useBanner(DAPP_DISCLAIMER_ID);
  const dispatch = useDispatch();
  const history = useHistory();

  const openApp = useCallback(
    (manifest: AppManifest) => {
      history.push(`/platform/${manifest.id}`);
    },
    [history],
  );

  const close = useCallback(() => {
    dispatch(closePlatformAppDrawer());
  }, [dispatch]);

  const prompt = useCallback(
    (manifest: AppManifest, onConfirm: (manifest: AppManifest, isChecked: boolean) => void) => {
      dispatch(
        openPlatformAppDisclaimerDrawer({
          manifest,
          disclaimerId: DAPP_DISCLAIMER_ID,
          next: onConfirm,
        }),
      );
    },
    [dispatch],
  );

  return useDisclaimerRaw({
    isDismissed,
    appendRecentlyUsed,
    uiHook: {
      dismiss,
      prompt,
      close,
      openApp,
    },
  });
}

// TODO: share with mobile
function useBanner(id: string): [boolean, () => void] {
  const dispatch = useDispatch();
  const dismissedBanners = useSelector(dismissedBannersSelector);

  const isDismissed = useMemo(() => dismissedBanners.includes(id), [id, dismissedBanners]);

  const dismiss = useCallback(() => {
    dispatch(dismissBanner(id));
  }, [id, dispatch]);

  return [isDismissed, dismiss];
}

export type Search = SearchRaw<AppManifest>;
