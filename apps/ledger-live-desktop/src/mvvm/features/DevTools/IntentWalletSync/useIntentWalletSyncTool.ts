import { useCallback } from "react";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTrustchainSdk } from "../../WalletSync/hooks/useTrustchainSdk";
import { useCreateSessionSdk } from "../../WalletSync/deviceIntents/useCreateSessionSdk";
import { addMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWDDefinition";

/**
 * Binds the Ledger Sync intents devtool to the app: its trustchain store, its
 * SDK, and the session SDK the intents run their device calls with.
 */
export function useIntentWalletSyncTool() {
  const dispatch = useDispatch();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const sdk = useTrustchainSdk();
  const createSessionSdk = useCreateSessionSdk();

  const getMembers = useCallback(
    (current: Trustchain, credentials: MemberCredentials) => sdk.getMembers(current, credentials),
    [sdk],
  );

  const onTrustchainChange = useCallback(
    (next: Trustchain) => dispatch(setTrustchain(next)),
    [dispatch],
  );

  return useIntentWalletSyncToolState({
    addMemberIntentDefinition: addMemberIntentLWDDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWDDefinition,
    createSessionSdk,
    trustchain,
    memberCredentials,
    getMembers,
    onTrustchainChange,
  });
}
