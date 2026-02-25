import { useCallback, useEffect, useState } from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { dismissedManifestsAtom } from "LLM/features/Web3Hub/db";
import { useAtom } from "jotai";
import useRecentlyUsedViewModel from "../../screens/Web3HubSearch/components/RecentlyUsed/useRecentlyUsedViewModel";

export default function useDisclaimerViewModel(goToApp: (manifestId: string) => void) {
  const [isChecked, setIsChecked] = useState(false);
  const [disclaimerOpened, setDisclaimerOpened] = useState(false);
  const [disclaimerManifest, setDisclaimerManifest] = useState<AppManifest>();
  const [dismissedManifests, setDismissedManifests] = useAtom(dismissedManifestsAtom);

  const { addToRecentlyUsed } = useRecentlyUsedViewModel(goToApp);

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
        addToRecentlyUsed(manifest);
        goToApp(manifest.id);
      }
    },
    [dismissedManifests, addToRecentlyUsed, goToApp],
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

      addToRecentlyUsed(disclaimerManifest);
      goToApp(disclaimerManifest.id);
    }
  }, [disclaimerManifest, addToRecentlyUsed, goToApp, isChecked, setDismissedManifests]);

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
