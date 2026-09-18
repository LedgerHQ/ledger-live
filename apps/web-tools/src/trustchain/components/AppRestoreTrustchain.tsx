import React, { useCallback } from "react";
// LKRP_MIGRATION: getSdk / TrustchainSDK → @features/platform-lkrp createLkrpSdk (inject crypto, keystore, HTTP backend, optional device).
// LKRP_MIGRATION: Trustchain / MemberCredentials → @shared/lkrp (opaque key handle; no walletSyncEncryptionKey).
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppRestoreTrustchain({
  memberCredentials,
  trustchain,
  setTrustchain,
}: {
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
}) {
  const sdk = useTrustchainSDK();
  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.restoreTrustchain(trustchain, memberCredentials),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.restoreTrustchain"
      inputs={memberCredentials && trustchain ? [trustchain, memberCredentials] : null}
      action={action}
      setValue={setTrustchain}
      value={trustchain}
      valueDisplay={value => value?.applicationPath}
    />
  );
}
