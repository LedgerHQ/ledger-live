import React, { useCallback } from "react";
import {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppCreateNewTrustchain({
  deviceId,
  memberCredentials,
  setTrustchain,
  callbacks,
}: {
  deviceId: string;
  memberCredentials: MemberCredentials | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (memberCredentials: MemberCredentials) =>
      sdk
        .createTrustchain(deviceId, memberCredentials, callbacks)
        .then(result => result.trustchain),
    [deviceId, sdk, callbacks],
  );

  const valueDisplay = useCallback((trustchain: Trustchain) => trustchain.rootId, []);

  return (
    <Actionable
      buttonTitle="sdk.createTrustchain"
      inputs={memberCredentials ? [memberCredentials] : null}
      action={action}
      valueDisplay={valueDisplay}
      setValue={setTrustchain}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "creates a new Trustchain. (device required)",
      }}
    />
  );
}
