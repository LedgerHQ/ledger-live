import React, { useCallback } from "react";
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppAuthenticate({
  jwt,
  setJWT,
  memberCredentials,
  trustchain,
  deviceJWT,
}: {
  jwt: JWT | null;
  setJWT: (jwt: JWT | null) => void;
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  deviceJWT: JWT | null;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.auth(trustchain, memberCredentials),
    [sdk],
  );

  const valueDisplay = useCallback((jwt: JWT) => jwt.accessToken, []);

  return (
    <Actionable
      buttonTitle="sdk.auth"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={jwt}
      setValue={setJWT}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content": "authenticates with member credentials",
      }}
    >
      {deviceJWT && !jwt ? (
        <button style={{ opacity: 0.5, border: "none" }} onClick={() => setJWT(deviceJWT)}>
          set auth from authWithDevice value
        </button>
      ) : null}
    </Actionable>
  );
}
