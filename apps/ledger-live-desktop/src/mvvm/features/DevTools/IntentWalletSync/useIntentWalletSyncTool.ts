import { useMemo } from "react";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { setTrustchain } from "@ledgerhq/ledger-key-ring-protocol/store";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { useTrustchainSdkContext } from "../../WalletSync/hooks/useTrustchainSdkContext";
import { useCreateSessionSdk } from "../../WalletSync/deviceIntents/useCreateSessionSdk";
import { addMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWDDefinition";

/** Binds the Ledger Sync intents devtool to the app's SDK context and its session SDK. */
export function useIntentWalletSyncTool() {
  const { isMockEnv, context, lifecycle } = useTrustchainSdkContext();
  // Not the app's cached SDK: it keeps the environment it started with, the session SDK follows the flag.
  const sdk = useMemo(
    () => getSdk(isMockEnv, context, withDevice, lifecycle),
    [isMockEnv, context, lifecycle],
  );
  const createSessionSdk = useCreateSessionSdk();

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWDDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWDDefinition,
    createSessionSdk,
    sdk,
    setTrustchain,
  });
}
