import { useCallback } from "react";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTrustchainSdk } from "../../WalletSync/hooks/useTrustchainSdk";
import { useCreateSessionSdk } from "../../WalletSync/deviceIntents/useCreateSessionSdk";
import { addMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWMDefinition";
import { removeMemberIntentLWMDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWMDefinition";

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
    addMemberIntentDefinition: addMemberIntentLWMDefinition,
    removeMemberIntentDefinition: removeMemberIntentLWMDefinition,
    createSessionSdk,
    trustchain,
    memberCredentials,
    getMembers,
    onTrustchainChange,
  });
}
