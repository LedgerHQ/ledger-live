import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { setTrustchain } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useTrustchainSdk } from "../../WalletSync/hooks/useTrustchainSdk";
import { useCreateSessionSdk } from "../../WalletSync/deviceIntents/useCreateSessionSdk";
import { ledgerSyncResultOrder } from "../../WalletSync/deviceIntents/ledgerSyncResultOrder";
import { addMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWDDefinition";

/** Binds the Ledger Sync intents devtool to the app's cached SDK, its session SDK and its result order. */
export function useIntentWalletSyncTool() {
  const sdk = useTrustchainSdk();
  const createSessionSdk = useCreateSessionSdk();

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWDDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWDDefinition,
    createSessionSdk,
    resultOrder: ledgerSyncResultOrder,
    sdk,
    setTrustchain,
  });
}
