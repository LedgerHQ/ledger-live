import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useCallback } from "react";
import { recentlyUsedAtom } from "LLM/features/Web3Hub/db";
import { useAtom } from "jotai";

export type useRecentlyUsedViewModelExtraData = {
  onPressItem: (manifest: AppManifest) => void;
  onCloseItem: (manifest: AppManifest) => void;
};

export default function useRecentlyUsedViewModel(goToApp: (manifestId: string) => void) {
  const [recentlyUsed, setRecentlyUsed] = useAtom(recentlyUsedAtom);

  const addToRecentlyUsed = useCallback(
    (manifest: AppManifest) => {
      setRecentlyUsed(async state => {
        const s = await state;
        const r = s.filter(item => item.id !== manifest.id);
        return [manifest, ...r];
      });
    },
    [setRecentlyUsed],
  );

  const onPressItem = useCallback(
    (manifest: AppManifest) => {
      goToApp(manifest.id);
    },
    [goToApp],
  );

  const onCloseItem = (manifest: AppManifest) => {
    setRecentlyUsed(async state => {
      const s = await state;
      return s.filter(i => i.id !== manifest.id);
    });
  };

  const clearAll = useCallback(() => {
    setRecentlyUsed(() => []);
  }, [setRecentlyUsed]);

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
