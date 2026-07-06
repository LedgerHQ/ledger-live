import { useAleoPrivateSync as useAleoPrivateSyncCore } from "@ledgerhq/live-common/families/aleo/react";
import { accountSelector } from "~/renderer/reducers/accounts";
import type { State } from "~/renderer/reducers";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

type UseAleoPrivateSyncOptions = Omit<
  Parameters<typeof useAleoPrivateSyncCore>[0],
  "accountSelector" | "updateAccountWithUpdater"
>;

export const useAleoPrivateSync = (options: UseAleoPrivateSyncOptions) =>
  useAleoPrivateSyncCore({
    ...options,
    accountSelector: (state, params) => accountSelector(state as State, params),
    updateAccountWithUpdater,
  });
