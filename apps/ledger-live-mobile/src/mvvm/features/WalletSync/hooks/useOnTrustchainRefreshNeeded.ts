import { useOnKeyRingRefreshNeeded, type KeyRingRefreshOptions } from "@features/flow-ledger-sync";
import type { KeyRingClient, KeyRingSession } from "@features/platform-key-ring";

export function useOnTrustchainRefreshNeeded(
  client: KeyRingClient,
): (session: KeyRingSession) => Promise<void> {
  return useOnKeyRingRefreshNeeded(client, REFRESH_OPTIONS);
}

const REFRESH_OPTIONS: KeyRingRefreshOptions = {
  resetOnCategories: ["member-removed", "not-allowed"],
  readTreeIdAt: "render",
};
