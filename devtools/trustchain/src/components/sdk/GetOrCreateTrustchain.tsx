import { useCallback } from "react";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainSDK,
} from "../../types";
import { Actionable } from "../Actionable";

export function GetOrCreateTrustchain({
  sdk,
  deviceId,
  memberCredentials,
  trustchain,
  setTrustchain,
  callbacks,
}: Readonly<{
  sdk: TrustchainSDK;
  deviceId: string;
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (v: Trustchain | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}>) {
  const action = useCallback(
    (mc: MemberCredentials) =>
      sdk.getOrCreateTrustchain(deviceId, mc, callbacks).then(r => r.trustchain),
    [sdk, deviceId, callbacks],
  );

  return (
    <Actionable
      buttonTitle="sdk.getOrCreateTrustchain"
      inputs={memberCredentials ? [memberCredentials] : null}
      action={action}
      value={trustchain}
      setValue={setTrustchain}
      valueDisplay={v => v.rootId}
    />
  );
}
