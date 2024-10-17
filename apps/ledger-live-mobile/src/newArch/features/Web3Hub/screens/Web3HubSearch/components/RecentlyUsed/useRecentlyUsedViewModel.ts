import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { INITIAL_WEB3HUB_STATE, WEB3HUB_STORE_KEY } from "LLM/features/Web3Hub/constants";
import { Web3HubDB } from "LLM/features/Web3Hub/types";
import { useCallback } from "react";
import { useDB } from "~/db";

export type useRecentlyUsedViewModelExtraData = {
  onPressItem: (manifest: AppManifest) => void;
  onCloseItem: (manifest: AppManifest) => void;
};

const recentlyUsedSelector = (state: Web3HubDB) => state.recentlyUsed;

export function useRecentlyUsed() {
  return useDB<Web3HubDB, Web3HubDB["recentlyUsed"]>(
    WEB3HUB_STORE_KEY,
    INITIAL_WEB3HUB_STATE,
    recentlyUsedSelector,
  );
}

export default function useRecentlyUsedViewModel(goToApp: (manifestId: string) => void) {
  const [recentlyUsed, setWeb3HubDB] = useRecentlyUsed();

  const onPressItem = useCallback(
    (manifest: AppManifest) => {
      goToApp(manifest.id);
    },
    [goToApp],
  );

  const onCloseItem = (manifest: AppManifest) => {
    setWeb3HubDB(state => ({
      ...state,
      recentlyUsed: state.recentlyUsed.filter(i => i.id !== manifest.id),
    }));
  };

  const clearAll = useCallback(() => {
    setWeb3HubDB(state => ({
      ...state,
      recentlyUsed: [],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToRecentlyUsed = (manifest: AppManifest) => {
    setWeb3HubDB(state => {
      const rest = state.recentlyUsed.filter(r => r.id !== manifest.id);
      return {
        ...state,
        recentlyUsed: [manifest, ...rest],
      };
    });
  };

  return {
    data: recentlyUsed,
    clearAll,
    addToRecentlyUsed,
    extraData: {
      onPressItem,
      onCloseItem,
    },
  };
}
