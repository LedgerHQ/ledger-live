import React, { useCallback } from "react";
import { JWT, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppGetMembers({
  jwt,
  trustchain,
  members,
  setMembers,
}: {
  jwt: JWT | null;
  trustchain: Trustchain | null;
  members: TrustchainMember[] | null;
  setMembers: (members: TrustchainMember[] | null) => void;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (jwt: JWT, trustchain: Trustchain) => sdk.getMembers(jwt, trustchain),
    [sdk],
  );

  const valueDisplay = useCallback(
    (members: TrustchainMember[]) =>
      members.length +
      " member" +
      (members.length > 1 ? "s" : "") +
      (trustchain ? " at " + trustchain.applicationPath : ""),
    [trustchain],
  );

  return (
    <Actionable
      buttonTitle="sdk.getMembers"
      inputs={jwt && trustchain ? [jwt, trustchain] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={members}
      setValue={setMembers}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content": "fetches all members of the trustchain",
      }}
    />
  );
}
