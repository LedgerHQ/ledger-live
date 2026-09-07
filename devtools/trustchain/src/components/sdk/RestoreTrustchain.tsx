import { useCallback } from "react";
import type { MemberCredentials, Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

export function RestoreTrustchain({
  sdk,
  memberCredentials,
  trustchain,
  setTrustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (v: Trustchain | null) => void;
}>) {
  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) => sdk.restoreTrustchain(tc, mc),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.restoreTrustchain"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      value={trustchain}
      setValue={setTrustchain}
      valueDisplay={v => v.applicationPath}
    />
  );
}
