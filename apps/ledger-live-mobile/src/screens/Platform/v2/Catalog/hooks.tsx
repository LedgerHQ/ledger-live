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
import { getPlatform, savePlatform } from "../../../../db";

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
  appendRecentlyUsed: (manifest: AppManifest) => void,
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
  const fuse = useMemo(() => new Fuse(list, options), [list, options]);

  const onChange = useCallback((value: string) => {
    if (value.length !== 0) {
      setIsSearching(true);
    }

    setInput(value);
  }, []);

  useEffect(() => {
    if (debouncedInput) {
      setIsSearching(true);
      setResult(fuse.search(debouncedInput).map(res => res.item));
    } else {
      setResult([]);
    }

    setIsSearching(false);
  }, [debouncedInput, fuse]);

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
    onChange,
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
    getPlatform().then(state => {
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

export function useRecentlyUsed(manifests: LiveAppManifest[]) {
  const [ids, setState] = usePlatformState(state => state.recentlyUsed);

  const data = useMemo(
    () =>
      ids
        .map(id => manifests.find(m => m.id === id))
        .filter(m => m !== undefined) as LiveAppManifest[],
    [ids, manifests],
  );

  const append = useCallback(
    (manifest: LiveAppManifest) => {
      setState(state => {
        const index = state.recentlyUsed.findIndex(id => id === manifest.id);

        // Manifest already in first position
        if (index === 0) {
          return state;
        }

        // Manifest present we move it to the first position
        // No need to check for MAX_LENGTH as we only move it
        if (index !== -1) {
          return {
            ...state,
            recentlyUsed: [
              manifest.id,
              ...state.recentlyUsed.slice(0, index),
              ...state.recentlyUsed.slice(index + 1),
            ],
          };
        }

        // Manifest not preset we simply append and check for the length
        return {
          ...state,
          recentlyUsed:
            state.recentlyUsed.length >= MAX_LENGTH
              ? [manifest.id, ...state.recentlyUsed.slice(0, -1)]
              : [manifest.id, ...state.recentlyUsed],
        };
      });
    },
    [setState],
  );

  const clear = useCallback(() => {
    setState(state => ({ ...state, recentlyUsed: [] }));
  }, [setState]);

  return { data, append, clear };
}

const MAX_LENGTH = 10;
