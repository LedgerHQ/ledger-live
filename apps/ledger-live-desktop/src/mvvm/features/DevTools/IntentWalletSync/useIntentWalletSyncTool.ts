import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { commitKeyRingTree } from "@features/platform-key-ring";
import { useKeyRingClient } from "../../WalletSync/hooks/useKeyRingClient";
import { ledgerSyncResultOrder } from "@features/platform-ledger-sync";
import { addMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWDDefinition";

/** Binds the Ledger Sync intents devtool to the app's cached client and its result order. */
export function useIntentWalletSyncTool() {
  const keyRing = useKeyRingClient();

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWDDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWDDefinition,
    resultOrder: ledgerSyncResultOrder,
    keyRing,
    commitKeyRingTree,
  });
}
