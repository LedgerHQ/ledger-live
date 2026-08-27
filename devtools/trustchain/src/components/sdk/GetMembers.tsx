import { useCallback } from "react";
import type { MemberCredentials, Trustchain, TrustchainMember, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

export function GetMembers({
  sdk,
  memberCredentials,
  trustchain,
  members,
  setMembers,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
  members: TrustchainMember[] | null;
  setMembers: (v: TrustchainMember[] | null) => void;
  memberCredentials: MemberCredentials | null;
}>) {
  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) => sdk.getMembers(tc, mc),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.getMembers"
      inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
      action={action}
      value={members}
      setValue={setMembers}
      valueDisplay={v =>
        v.length +
        " member" +
        (v.length !== 1 ? "s" : "") +
        (trustchain ? " at " + trustchain.applicationPath : "")
      }
    />
  );
}
