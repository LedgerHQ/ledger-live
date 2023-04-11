import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { ScreenName } from "../../../../const";
import { useBanner } from "../../../../components/banners/hooks";
import { readOnlyModeEnabledSelector } from "../../../../reducers/settings";
import { NavigationProps } from "../types";

export function useCategories(manifests: AppManifest[]) {
  const { categories, manifestsByCategories } = useCategoriesRaw(manifests);
  const initialSelectedState = "all";
  const [selected, setSelected] = useState(initialSelectedState);

  return {
    categories,
    manifestsByCategories,
    initialSelectedState,
    selected,
    setSelected,
  };
}

function useCategoriesRaw(manifests: AppManifest[]): {
  categories: string[];
  manifestsByCategories: Map<string, AppManifest[]>;
} {
  const manifestsByCategories = useMemo(() => {
    const res = manifests.reduce((res, m) => {
      m.categories.forEach(c => {
        const list = res.has(c) ? [...res.get(c), m] : [m];
        res.set(c, list);
      });

      return res;
    }, new Map().set("all", manifests));

    return res;
  }, [manifests]);

  const categories = useMemo(
    () => [...manifestsByCategories.keys()],
    [manifestsByCategories],
  );

  return {
    categories,
    manifestsByCategories,
  };
}

export function useDeeplinkEffect(
  manifests: AppManifest[],
  openApp: (manifest: AppManifest) => void,
) {
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

const DAPP_DISCLAIMER_ID = "PlatformAppDisclaimer";

export function useDisclaimer(
  appendRecentlyUsed: (manifest: AppManifest) => void,
) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const { platform, ...params } = route.params ?? {};

  const isReadOnly = useSelector(readOnlyModeEnabledSelector);
  const [isDismissed, dismiss] = useBanner(DAPP_DISCLAIMER_ID);

  const [manifest, setManifest] = useState<AppManifest>();
  const [isChecked, setIsChecked] = useState(false);

  const openApp = useCallback(
    (manifest: AppManifest) => {
      navigation.navigate(ScreenName.PlatformApp, {
        ...params,
        platform: manifest.id,
        name: manifest.name,
      });
      appendRecentlyUsed(manifest);
    },
    [navigation, params, appendRecentlyUsed],
  );

  const close = useCallback(() => {
    setManifest(undefined);
  }, [setManifest]);

  const onContinue = useCallback(() => {
    if (!manifest) return;

    if (isChecked) {
      dismiss();
    }

    close();
    openApp(manifest);
  }, [close, dismiss, isChecked, openApp, manifest]);

  const toggleCheck = useCallback(() => {
    setIsChecked(isDisabled => !isDisabled);
  }, [setIsChecked]);

  return {
    name: manifest?.name,
    icon: manifest?.icon,
    isOpened: !!manifest,
    isChecked,
    isDismissed,
    isReadOnly,
    onClose: close,
    onContinue,
    openApp,
    close,
    toggleCheck,
    prompt: setManifest,
  };
}
