import {
  memberCredentialsSelector,
  setMemberCredentials,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTrustchainSdk } from "./useTrustchainSdk";

// Shared by every caller, so overlapping callers store and enroll the same keypair.
let pendingGeneration: Promise<void> | null = null;

export function useInitMemberCredentials() {
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();

  const memberCredentials = useSelector(memberCredentialsSelector);

  const generateMemberCredentials = useCallback(async () => {
    if (memberCredentials) return;
    pendingGeneration ??= sdk
      .initMemberCredentials()
      .then(newMemberCredentials => {
        dispatch(setMemberCredentials(newMemberCredentials));
      })
      .finally(() => {
        pendingGeneration = null;
      });
    await pendingGeneration;
  }, [memberCredentials, sdk, dispatch]);

  useEffect(() => {
    generateMemberCredentials();
  }, [generateMemberCredentials]);

  return { memberCredentials, generateMemberCredentials };
}
