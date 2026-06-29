import React, { useCallback, useState } from "react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppDestroyApplication({
  trustchain,
  setTrustchain,
  memberCredentials,
}: {
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  memberCredentials: MemberCredentials | null;
}) {
  const sdk = useTrustchainSDK();
  const [value, setValue] = useState<{ trustchainDestroyed: boolean } | null>(null);
  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.destroyApplication(trustchain, memberCredentials).then(result => {
        setTrustchain(null);
        return result;
      }),
    [sdk, setTrustchain],
  );

  return (
    <Actionable
      buttonTitle="sdk.destroyApplication"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      value={value}
      setValue={setValue}
      valueDisplay={value =>
        value.trustchainDestroyed
          ? "last application: whole trustchain destroyed"
          : "application stream closed (trustchain root kept)"
      }
    />
  );
}
