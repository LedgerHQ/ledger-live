import { useEffect, useCallback, useState, useMemo } from "react";
import { TextInput } from "react-native";
import {
  useCategories,
  useDisclaimerRaw,
  useRecentlyUsed,
  DisclaimerRaw,
} from "@ledgerhq/live-common/wallet-api/react";
import {
  INITIAL_PLATFORM_STATE,
  DAPP_DISCLAIMER_ID,
  DISCOVER_STORE_KEY,
  BROWSE_SEARCH_OPTIONS,
} from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB, AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useSearch } from "@ledgerhq/live-common/hooks/useSearch";
import { useDB } from "../../../db";
import { ScreenName } from "~/const";
import { useBanner } from "~/components/banners/hooks";
import { readOnlyModeEnabledSelector } from "../../../reducers/settings";
import { NavigationProps } from "./types";

export function useCatalog() {
  const db = useDiscoverDB();
  const categories = useCategories();
  const recentlyUsed = useRecentlyUsed(categories.manifests.all, db);

  const search = useSearch<AppManifest, TextInput>({
    listInput: categories.searchable,
    listFilter: categories.searchable,
    options: BROWSE_SEARCH_OPTIONS,
  });

  const { reset } = categories;
  useEffect(() => {
    search.isActive && reset();
  }, [search.isActive, reset]);

  const disclaimer = useDisclaimer(recentlyUsed.append);

  useDeeplinkEffect(categories.manifests.all, disclaimer.openApp);

  return useMemo(
    () => ({
      categories,
      recentlyUsed,
      search,
      disclaimer,
    }),
    [categories, recentlyUsed, search, disclaimer],
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
  const [isDismissed, dismiss] = useBanner(DAPP_DISCLAIMER_ID);

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const { platform, ...params } = route.params ?? {};

  const [manifest, setManifest] = useState<AppManifest>();
  const [isChecked, setIsChecked] = useState(false);

  const openApp = useCallback(
    (manifest: AppManifest) => {
      navigation.navigate(ScreenName.PlatformApp, {
        ...params,
        platform: manifest.id,
        name: manifest.name,
      });
    },
    [navigation, params],
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

function useDiscoverDB() {
  return useDB<DiscoverDB, DiscoverDB["recentlyUsed"]>(
    DISCOVER_STORE_KEY,
    INITIAL_PLATFORM_STATE,
    state => state.recentlyUsed,
  );
}
