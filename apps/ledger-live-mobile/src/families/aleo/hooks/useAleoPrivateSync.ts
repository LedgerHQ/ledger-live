import { useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useAleoPrivateSync as useAleoPrivateSyncCore } from "@ledgerhq/live-common/families/aleo/react";
import { accountSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import { updateAccountWithUpdater } from "~/actions/accounts";

type UseAleoPrivateSyncOptions = Omit<
  Parameters<typeof useAleoPrivateSyncCore>[0],
  "accountSelector" | "updateAccountWithUpdater"
>;

export const useAleoPrivateSync = ({ autoStart, ...options }: UseAleoPrivateSyncOptions) => {
  const isFocused = useIsFocused();
  // Gating on focus keeps autoStart from firing on a screen the
  // user hasn't actually opened yet, on either platform.
  const hasBeenFocusedRef = useRef(isFocused);
  if (isFocused) hasBeenFocusedRef.current = true;

  return useAleoPrivateSyncCore({
    ...options,
    autoStart: autoStart && hasBeenFocusedRef.current,
    accountSelector: (state, params) => accountSelector(state as State, params),
    updateAccountWithUpdater: (accountId, updater) =>
      updateAccountWithUpdater({ accountId, updater }),
  });
};
