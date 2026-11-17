import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { setTrustchain } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useTrustchainSdk } from "../../WalletSync/hooks/useTrustchainSdk";
import { useCreateSessionSdk } from "../../WalletSync/deviceIntents/useCreateSessionSdk";
import { ledgerSyncResultOrder } from "../../WalletSync/deviceIntents/ledgerSyncResultOrder";
import { addMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWMDefinition";
import { removeMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWMDefinition";

/** Binds the Ledger Sync intents devtool to the app's cached SDK, its session SDK and its result order. */
export function useIntentWalletSyncTool() {
  const sdk = useTrustchainSdk();
  const createSessionSdk = useCreateSessionSdk();

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWMDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWMDefinition,
    createSessionSdk,
    resultOrder: ledgerSyncResultOrder,
    sdk,
    setTrustchain,
  });
}
