import React, { useCallback } from "react";
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppDestroyTrustchain({
  trustchain,
  setTrustchain,
  memberCredentials,
}: {
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  memberCredentials: MemberCredentials | null;
}) {
  const sdk = useTrustchainSDK();
  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.destroyTrustchain(trustchain, memberCredentials).then(() => {
        // all of these state should be reset
        setTrustchain(null);
      }),
    [sdk, setTrustchain],
  );

  return (
    <Actionable
      buttonTitle="sdk.destroyTrustchain"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content": "completely removes the trustchain",
      }}
    />
  );
}
