import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { ledgerSyncResultOrder } from "@features/platform-ledger-sync";
import { commitKeyRingTree } from "@features/platform-key-ring";
import { useKeyRingClient } from "../../WalletSync/hooks/useKeyRingClient";
import { addMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWMDefinition";
import { removeMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWMDefinition";

/** Binds the Ledger Sync intents devtool to the app's cached client and its result order. */
export function useIntentWalletSyncTool() {
  const keyRing = useKeyRingClient();

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWMDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWMDefinition,
    resultOrder: ledgerSyncResultOrder,
    keyRing,
    commitKeyRingTree,
  });
}
