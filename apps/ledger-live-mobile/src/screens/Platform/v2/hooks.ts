import { useEffect, useCallback, useState, useMemo } from "react";
import { TextInput } from "react-native";
import {
  useCategories,
  useDisclaimerRaw,
  useRecentlyUsed,
  DisclaimerRaw,
  Categories,
} from "@ledgerhq/live-common/wallet-api/react";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";

import {
  INITIAL_PLATFORM_STATE,
  DAPP_DISCLAIMER_ID,
  DISCOVER_STORE_KEY,
  BROWSE_SEARCH_OPTIONS,
  WC_ID,
} from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB, AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useSearch } from "@ledgerhq/live-common/hooks/useSearch";
import { useDB } from "../../../db";
import { NavigatorName, ScreenName } from "~/const";
import { useBanner } from "~/components/banners/hooks";
import { hasOrderedNanoSelector, readOnlyModeEnabledSelector } from "../../../reducers/settings";
import { NavigationProps } from "./types";
import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";

export function useCatalog(initialCategory?: Categories["selected"] | null) {
  const recentlyUsedDB = useRecentlyUsedDB();
  const { state: localLiveApps } = useLocalLiveAppContext();
  const allManifests = useManifests();
  const completeManifests = useManifests({ visibility: ["complete"] });
  const combinedManifests = useManifests({ visibility: ["searchable", "complete"] });
  const categories = useCategories(completeManifests, initialCategory);
  const recentlyUsed = useRecentlyUsed(combinedManifests, recentlyUsedDB);

  const search = useSearch<AppManifest, TextInput>({
    list: combinedManifests,
    options: BROWSE_SEARCH_OPTIONS,
    filter: (item: AppManifest, input: string) => {
      // Return all manifests when searching
      if (input) return true;

      // Only return complete manifests when not searching
      if (item.visibility !== "complete") return false;

      if (categories.selected === "all") return true;

      return item.categories.includes(categories.selected);
    },
  });

  const { reset } = categories;
  useEffect(() => {
    search.isActive && reset();
  }, [search.isActive, reset]);

  const disclaimer = useDisclaimer(recentlyUsed.append);

  useDeeplinkEffect(allManifests, disclaimer.openApp);

  return useMemo(
    () => ({
      categories,
      recentlyUsed,
      search,
      disclaimer,
      localLiveApps,
    }),
    [categories, recentlyUsed, search, disclaimer, localLiveApps],
  );
}

function useDeeplinkEffect(manifests: AppManifest[], openApp: (manifest: AppManifest) => void) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const { platform, ...params } = route.params ?? {};

  useEffect(() => {
    // platform can be predefined when coming from a deeplink
    if (platform && manifests) {
      const manifest = manifests.find(m => m.id === platform);

      if (!manifest) return;

      openApp(manifest);
    }
  }, [platform, manifests, navigation, params, openApp]);
}

export type Disclaimer = DisclaimerRaw & {
  onConfirm: () => void;
  name?: string | null;
  icon?: string | null;
  isOpened: boolean;
  isChecked: boolean;
  toggleCheck: () => void;
  onClose: () => void;
  openApp: (manifest: AppManifest) => void;
};

function useDisclaimer(appendRecentlyUsed: (manifest: AppManifest) => void): Disclaimer {
  const isReadOnly = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const [isDismissed, dismiss] = useBanner(DAPP_DISCLAIMER_ID);

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const { platform, ...params } = route.params ?? {};
  const { navigateToRebornFlow } = useRebornFlow();

  const [manifest, setManifest] = useState<AppManifest>();
  const [isChecked, setIsChecked] = useState(false);

  const openApp = useCallback(
    (manifest: AppManifest) => {
      // Navigate to the WalletConnect navigator screen instead of the discover one
      // In order to avoid issue with deeplinks opening wallet-connect multiple times
      if (manifest.id === WC_ID) {
        navigation.navigate(NavigatorName.WalletConnect, {
          screen: ScreenName.WalletConnectConnect,
          params: {},
        });
        return;
      }

      if (isReadOnly && !hasOrderedNano) {
        navigateToRebornFlow();
        return;
      }

      navigation.navigate(ScreenName.PlatformApp, {
        ...params,
        platform: manifest.id,
        name: manifest.name,
      });
    },
    [hasOrderedNano, isReadOnly, navigateToRebornFlow, navigation, params],
  );

  const toggleCheck = useCallback(() => {
    setIsChecked(isDisabled => !isDisabled);
  }, [setIsChecked]);

  const onClose = useCallback(() => {
    setManifest(undefined);
  }, []);

  const raw = useDisclaimerRaw({
    isReadOnly,
    isDismissed,
    appendRecentlyUsed,
    uiHook: {
      dismiss,
      prompt: setManifest,
      close: onClose,
      openApp,
    },
  });

  const onConfirm = useCallback(() => {
    if (!manifest) return;

    raw.onConfirm(manifest, isChecked);
  }, [raw, manifest, isChecked]);

  return {
    ...raw,
    onConfirm,
    name: manifest?.name,
    icon: manifest?.icon,
    isOpened: !!manifest,
    isChecked,
    toggleCheck,
    onClose,
    openApp,
  };
}

function useRecentlyUsedDB() {
  return useDB<DiscoverDB, DiscoverDB["recentlyUsed"]>(
    DISCOVER_STORE_KEY,
    INITIAL_PLATFORM_STATE,
    state => state.recentlyUsed,
  );
}

export function useCurrentAccountHistDB() {
  return useDB<DiscoverDB, DiscoverDB["currentAccountHist"]>(
    DISCOVER_STORE_KEY,
    INITIAL_PLATFORM_STATE,
    state => state.currentAccountHist,
  );
}

export function useCacheBustedLiveAppsDB() {
  return useDB<DiscoverDB, DiscoverDB["cacheBustedLiveApps"]>(
    DISCOVER_STORE_KEY,
    INITIAL_PLATFORM_STATE,
    state => state.cacheBustedLiveApps,
  );
}
