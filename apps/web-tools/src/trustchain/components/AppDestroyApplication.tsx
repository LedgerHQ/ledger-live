import React, { useCallback, useState } from "react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppDestroyApplication({
  trustchain,
  setTrustchain,
  memberCredentials,
  destroyWithDevice,
}: {
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  memberCredentials: MemberCredentials | null;
  // Overrides the software sdk.destroyApplication, e.g. when the backend requires a device login
  destroyWithDevice?: (trustchain: Trustchain) => Promise<unknown>;
}) {
  const sdk = useTrustchainSDK();
  const [value, setValue] = useState<{ trustchainDestroyed: boolean } | null>(null);
  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      (destroyWithDevice
        ? destroyWithDevice(trustchain).then(() => ({ trustchainDestroyed: false }))
        : sdk.destroyApplication(trustchain, memberCredentials)
      ).then(result => {
        setTrustchain(null);
        return result;
      }),
    [sdk, setTrustchain, destroyWithDevice],
  );

  return (
    <Actionable
      buttonTitle={
        destroyWithDevice ? "sdk.closeApplicationStreamWithHardware" : "sdk.destroyApplication"
      }
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
