import { useCallback, useEffect, useState } from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { dismissedManifestsAtom, recentlyUsedAtom } from "LLM/features/Web3Hub/db";
import { useAtom, useSetAtom } from "jotai";
import { MainProps, SearchProps } from "LLM/features/Web3Hub/types";
import goToApp from "LLM/features/Web3Hub/utils/navigation";

function addToRecentlyUsed(manifest: AppManifest) {
  return async (state: AppManifest[] | Promise<AppManifest[]>) => {
    const s = await state;
    const r = s.filter(item => item.id !== manifest.id);
    return [manifest, ...r];
  };
}

export default function useDisclaimerViewModel(
  navigation: SearchProps["navigation"] | MainProps["navigation"],
) {
  const [isChecked, setIsChecked] = useState(false);
  const [disclaimerOpened, setDisclaimerOpened] = useState(false);
  const [disclaimerManifest, setDisclaimerManifest] = useState<AppManifest>();
  const [dismissedManifests, setDismissedManifests] = useAtom(dismissedManifestsAtom);
  const setRecentlyUsed = useSetAtom(recentlyUsedAtom);

  useEffect(() => {
    if (disclaimerManifest && !!dismissedManifests[disclaimerManifest.id]) {
      setIsChecked(true);
    } else {
      setIsChecked(false);
    }
  }, [disclaimerManifest, dismissedManifests]);

  const onPressItem = useCallback(
    (manifest: AppManifest) => {
      if (manifest.branch === "soon") {
        return;
      }

      if (!dismissedManifests[manifest.id] && manifest.author !== "ledger") {
        setDisclaimerManifest(manifest);
        setDisclaimerOpened(true);
      } else {
        setRecentlyUsed(addToRecentlyUsed(manifest));
        goToApp(navigation, manifest.id);
      }
    },
    [dismissedManifests, setRecentlyUsed, navigation],
  );

  const toggleCheck = useCallback(() => {
    setIsChecked(value => !value);
  }, []);

  const onConfirm = useCallback(() => {
    if (disclaimerManifest) {
      if (isChecked) {
        setDismissedManifests(async state => {
          const s = await state;
          return {
            ...s,
            [disclaimerManifest.id]: !s[disclaimerManifest.id],
          };
        });
      }

      setRecentlyUsed(addToRecentlyUsed(disclaimerManifest));
      goToApp(navigation, disclaimerManifest.id);
    }
  }, [disclaimerManifest, navigation, isChecked, setDismissedManifests, setRecentlyUsed]);

  const onClose = useCallback(() => {
    setDisclaimerOpened(false);
  }, []);

  return {
    manifest: disclaimerManifest,
    isOpened: disclaimerOpened,
    isChecked,
    toggleCheck,
    onConfirm,
    onClose,
    onPressItem,
  };
}
