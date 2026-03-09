import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useCallback } from "react";
import { recentlyUsedAtom } from "LLM/features/Web3Hub/db";
import { SearchProps } from "LLM/features/Web3Hub/types";
import { useAtom } from "jotai";
import { NavigatorName, ScreenName } from "~/const";

export type useRecentlyUsedViewModelExtraData = {
  onPressItem: (manifest: AppManifest) => void;
  onCloseItem: (manifest: AppManifest) => void;
};

export default function useRecentlyUsedViewModel(navigation: SearchProps["navigation"]) {
  const [recentlyUsed, setRecentlyUsed] = useAtom(recentlyUsedAtom);

  const goToApp = useCallback(
    (manifestId: string) => {
      navigation.push(NavigatorName.Web3Hub, {
        screen: ScreenName.Web3HubApp,
        params: {
          manifestId: manifestId,
        },
      });
    },
    [navigation],
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
    extraData: {
      onPressItem,
      onCloseItem,
    },
  };
}
