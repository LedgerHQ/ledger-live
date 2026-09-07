import { useCallback } from "react";
import type { MemberCredentials, Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

export function DestroyTrustchain({
  sdk,
  trustchain,
  memberCredentials,
  setTrustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  setTrustchain: (v: Trustchain | null) => void;
}>) {
  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) =>
      sdk.destroyTrustchain(tc, mc).then(() => setTrustchain(null)),
    [sdk, setTrustchain],
  );

  return (
    <Actionable
      buttonTitle="sdk.destroyTrustchain"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
    />
  );
}
