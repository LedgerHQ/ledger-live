import React, { useCallback } from "react";
// LKRP_MIGRATION: getSdk / TrustchainSDK → @features/platform-lkrp createLkrpSdk (inject crypto, keystore, HTTP backend, optional device).
// LKRP_MIGRATION: Trustchain / MemberCredentials → @shared/lkrp (opaque key handle; no walletSyncEncryptionKey).
import { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppInitLiveCredentials({
  memberCredentials,
  setMemberCredentials,
}: {
  memberCredentials: MemberCredentials | null;
  setMemberCredentials: (memberCredentials: MemberCredentials | null) => void;
}) {
  const sdk = useTrustchainSDK();
  const action = useCallback(() => sdk.initMemberCredentials(), [sdk]);

  const valueDisplay = useCallback(
    (memberCredentials: MemberCredentials) => "pubkey: " + memberCredentials.pubkey,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.initMemberCredentials"
      inputs={[]}
      action={action}
      setValue={setMemberCredentials}
      value={memberCredentials}
      valueDisplay={valueDisplay}
    />
  );
}
