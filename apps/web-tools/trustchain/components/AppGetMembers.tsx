import React, { useCallback } from "react";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppGetMembers({
  memberCredentials,
  trustchain,
  members,
  setMembers,
}: {
  trustchain: Trustchain | null;
  members: TrustchainMember[] | null;
  setMembers: (members: TrustchainMember[] | null) => void;
  memberCredentials: MemberCredentials | null;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk.getMembers(trustchain, memberCredentials),
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
      inputs={memberCredentials && trustchain ? [trustchain, memberCredentials] : null}
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
