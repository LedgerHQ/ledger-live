import { useCallback, useEffect, useState } from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { INITIAL_WEB3HUB_STATE, WEB3HUB_STORE_KEY } from "LLM/features/Web3Hub/constants";
import { Web3HubDB } from "LLM/features/Web3Hub/types";
import { useDB } from "~/db";

const dismissedManifestsSelector = (state: Web3HubDB) => state.dismissedManifests;

export function useDismissedManifests() {
  return useDB<Web3HubDB, Web3HubDB["dismissedManifests"]>(
    WEB3HUB_STORE_KEY,
    INITIAL_WEB3HUB_STATE,
    dismissedManifestsSelector,
  );
}

export default function useDisclaimerViewModel(goToApp: (manifestId: string) => void) {
  const [isChecked, setIsChecked] = useState(false);
  const [disclaimerOpened, setDisclaimerOpened] = useState(false);
  const [disclaimerManifest, setDisclaimerManifest] = useState<AppManifest>();
  const [dismissedManifests, setWeb3HubDB] = useDismissedManifests();

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
        setWeb3HubDB(state => {
          const rest = state.recentlyUsed.filter(r => r.id !== manifest.id);
          return {
            ...state,
            recentlyUsed: [manifest, ...rest],
          };
        });
        goToApp(manifest.id);
      }
    },
    [dismissedManifests, goToApp, setWeb3HubDB],
  );

  const toggleCheck = useCallback(() => {
    setIsChecked(value => !value);
  }, []);

  const onConfirm = useCallback(() => {
    if (disclaimerManifest) {
      if (isChecked) {
        setWeb3HubDB(state => {
          const rest = state.recentlyUsed.filter(r => r.id !== disclaimerManifest.id);
          return {
            ...state,
            recentlyUsed: [disclaimerManifest, ...rest],
            dismissedManifests: {
              ...state.dismissedManifests,
              [disclaimerManifest.id]: !state.dismissedManifests[disclaimerManifest.id],
            },
          };
        });
      } else {
        setWeb3HubDB(state => {
          const rest = state.recentlyUsed.filter(r => r.id !== disclaimerManifest.id);
          return {
            ...state,
            recentlyUsed: [disclaimerManifest, ...rest],
          };
        });
      }
      goToApp(disclaimerManifest.id);
    }
  }, [disclaimerManifest, goToApp, isChecked, setWeb3HubDB]);

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
