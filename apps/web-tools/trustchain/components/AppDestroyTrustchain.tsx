import React, { useCallback } from "react";
import { JWT, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppDestroyTrustchain({
  trustchain,
  jwt,
  setTrustchain,
  setJWT,
  setDeviceJWT,
}: {
  trustchain: Trustchain | null;
  jwt: JWT | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setJWT: (jwt: JWT | null) => void;
  setDeviceJWT: (deviceJWT: JWT | null) => void;
}) {
  const sdk = useTrustchainSDK();
  const action = useCallback(
    (trustchain: Trustchain, jwt: JWT) =>
      sdk.destroyTrustchain(trustchain, jwt).then(() => {
        // all of these state should be reset
        setTrustchain(null);
        setJWT(null);
        setDeviceJWT(null);
      }),
    [sdk, setTrustchain, setJWT, setDeviceJWT],
  );

  return (
    <Actionable
      buttonTitle="sdk.destroyTrustchain"
      inputs={trustchain && jwt ? [trustchain, jwt] : null}
      action={action}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content": "completely removes the trustchain",
      }}
    />
  );
}
