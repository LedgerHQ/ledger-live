import { useMemo } from "react";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { setTrustchain } from "@ledgerhq/ledger-key-ring-protocol/store";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { useTrustchainSdkContext } from "../../WalletSync/hooks/useTrustchainSdkContext";
import { useCreateSessionSdk } from "../../WalletSync/deviceIntents/useCreateSessionSdk";
import { addMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWMDefinition";
import { removeMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWMDefinition";

/** Binds the Ledger Sync intents devtool to the app's SDK context and its session SDK. */
export function useIntentWalletSyncTool() {
  const { isMockEnv, context } = useTrustchainSdkContext();
  // Not the app's cached SDK: it keeps the environment it started with, the session SDK follows the flag.
  const sdk = useMemo(() => getSdk(isMockEnv, context, withDevice), [isMockEnv, context]);
  const createSessionSdk = useCreateSessionSdk();

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWMDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWMDefinition,
    createSessionSdk,
    sdk,
    setTrustchain,
  });
}
