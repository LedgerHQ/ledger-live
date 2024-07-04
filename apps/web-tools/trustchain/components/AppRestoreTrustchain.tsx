import React, { useCallback } from "react";
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppRestoreTrustchain({
  memberCredentials,
  trustchain,
  setTrustchain,
}: {
  memberCredentials: MemberCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
}) {
  const sdk = useTrustchainSDK();
  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.restoreTrustchain(trustchain, memberCredentials),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.restoreTrustchain"
      inputs={memberCredentials && trustchain ? [trustchain, memberCredentials] : null}
      action={action}
      setValue={setTrustchain}
      value={trustchain}
      valueDisplay={value => value?.applicationPath}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "refresh the trustchain state after a possible derivation change (rotation)",
      }}
    />
  );
}
