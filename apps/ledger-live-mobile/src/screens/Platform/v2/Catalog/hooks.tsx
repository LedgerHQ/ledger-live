import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { TextInput } from "react-native";
import Fuse from "fuse.js";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { ScreenName } from "../../../../const";
import { useBanner } from "../../../../components/banners/hooks";
import { readOnlyModeEnabledSelector } from "../../../../reducers/settings";
import { NavigationProps, PlatformState, SearchBarValues } from "./types";
import { getPlatfrom, savePlatform } from "../../../../db";

export function useCategories() {
  const manifests = useManifests();
  const { categories, manifestsByCategories } = useCategoriesRaw(manifests);
  const initialSelectedState = "all";
  const [selected, setSelected] = useState(initialSelectedState);

  return {
    manifests,
    categories,
    manifestsByCategories,
    initialSelectedState,
    selected,
    setSelected,
  };
}

function useCategoriesRaw(manifests: LiveAppManifest[]): {
  categories: string[];
  manifestsByCategories: Map<string, LiveAppManifest[]>;
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
  manifests: LiveAppManifest[],
  openApp: (manifest: LiveAppManifest) => void,
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
  pushRecentlyUsed: (manifest: AppManifest) => void,
) {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const { platform, ...params } = route.params ?? {};

  const isReadOnly = useSelector(readOnlyModeEnabledSelector);
  const [isDismissed, dismiss] = useBanner(DAPP_DISCLAIMER_ID);

  const [manifest, setManifest] = useState<LiveAppManifest>();
  const [isChecked, setIsChecked] = useState(false);

  const openApp = useCallback(
    (manifest: LiveAppManifest) => {
      navigation.navigate(ScreenName.PlatformApp, {
        ...params,
        platform: manifest.id,
        name: manifest.name,
      });
      pushRecentlyUsed(manifest);
    },
    [navigation, params, pushRecentlyUsed],
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

// TODO: Move somewhere more appropriate
export function useSearch<Item>({
  list,
  defaultInput = "",
  options,
}: {
  list: Item[];
  defaultInput?: string;
  options: Fuse.IFuseOptions<Item>;
}): SearchBarValues<Item> {
  const inputRef = useRef<TextInput>(null);
  const [isActive, setIsActive] = useState(false);

  const [input, setInput] = useState(defaultInput);
  const debouncedInput = useDebounce(input, 500);

  const [isSearching, setIsSearching] = useState(false);

  const [result, setResult] = useState(list);
  // TODO: what if list chanegs
  const fuse = useRef(new Fuse(list, options));

  useEffect(() => {
    if (debouncedInput) {
      setIsSearching(true);
      setResult(fuse.current.search(debouncedInput).map(res => res.item));
    } else {
      setResult([]);
    }

    setIsSearching(false);
  }, [debouncedInput]);

  const onFocus = useCallback(() => {
    setIsActive(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  const onCancel = useCallback(() => {
    setInput("");
    setIsActive(false);

    inputRef.current?.blur();
  }, []);

  return {
    inputRef,
    input,
    result,
    isActive,
    isSearching,
    onChange: setInput,
    onFocus,
    onCancel,
  };
}

const INITIAL_PLATFORM_STATE = { recentlyUsed: [] };

function usePlatformState<T>(
  selector: (state: PlatformState) => T,
): [T, React.Dispatch<React.SetStateAction<PlatformState>>] {
  const [state, setState] = useState<PlatformState>(INITIAL_PLATFORM_STATE);

  useEffect(() => {
    getPlatfrom().then(state => {
      if (!state) {
        savePlatform(INITIAL_PLATFORM_STATE);
        return;
      }

      setState(state);
    });
  }, []);

  useEffect(() => {
    savePlatform(state);
  }, [state]);

  const result = useMemo(() => selector(state), [state, selector]);

  return [result, setState];
}

export function useRecentlyUsed(
  manifests: LiveAppManifest[],
): [LiveAppManifest[], (manifest: LiveAppManifest) => void] {
  const [ids, setState] = usePlatformState(state => state.recentlyUsed);

  const res = useMemo(
    () =>
      ids
        .map(id => manifests.find(m => m.id === id))
        .filter(m => m !== undefined) as LiveAppManifest[],
    [ids, manifests],
  );

  const push = useCallback(
    (manifest: LiveAppManifest) => {
      setState(state =>
        state.recentlyUsed.includes(manifest.id)
          ? state
          : {
              ...state,
              recentlyUsed: [...state.recentlyUsed, manifest.id],
            },
      );
    },
    [setState],
  );

  return [res, push];
}
