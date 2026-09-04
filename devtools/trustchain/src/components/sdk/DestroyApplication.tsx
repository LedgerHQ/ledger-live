import { useCallback, useState } from "react";
import type { MemberCredentials, Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

export function DestroyApplication({
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
  const [result, setResult] = useState<{ trustchainDestroyed: boolean } | null>(null);

  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) =>
      sdk.destroyApplication(tc, mc).then(r => {
        setTrustchain(null);
        return r;
      }),
    [sdk, setTrustchain],
  );

  return (
    <Actionable
      buttonTitle="sdk.destroyApplication"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      value={result}
      setValue={setResult}
      valueDisplay={v =>
        v.trustchainDestroyed
          ? "last app: whole trustchain destroyed"
          : "application stream closed (root kept)"
      }
    />
  );
}
