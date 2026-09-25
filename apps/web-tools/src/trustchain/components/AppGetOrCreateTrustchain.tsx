import React, { useCallback } from "react";
// LKRP_MIGRATION: getSdk / TrustchainSDK → @features/platform-lkrp createLkrpSdk (inject crypto, keystore, HTTP backend, optional device).
// LKRP_MIGRATION: Trustchain / MemberCredentials → @shared/lkrp (opaque key handle; no walletSyncEncryptionKey).
import {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppGetOrCreateTrustchain({
  deviceId,
  memberCredentials,
  trustchain,
  setTrustchain,
  callbacks,
}: {
  deviceId: string;
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (memberCredentials: MemberCredentials) =>
      sdk
        .getOrCreateTrustchain(deviceId, memberCredentials, callbacks)
        .then(result => result.trustchain),
    [deviceId, sdk, callbacks],
  );

  const valueDisplay = useCallback((trustchain: Trustchain) => trustchain.rootId, []);

  return (
    <Actionable
      buttonTitle="sdk.getOrCreateTrustchain"
      inputs={memberCredentials ? [memberCredentials] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={trustchain}
      setValue={setTrustchain}
    />
  );
}
