import { useCallback } from "react";
import type { MemberCredentials, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

export function InitCredentials({
  sdk,
  memberCredentials,
  setMemberCredentials,
}: Readonly<{
  sdk: TrustchainSDK;
  memberCredentials: MemberCredentials | null;
  setMemberCredentials: (v: MemberCredentials | null) => void;
}>) {
  const action = useCallback(() => sdk.initMemberCredentials(), [sdk]);

  return (
    <Actionable
      buttonTitle="sdk.initMemberCredentials"
      inputs={[]}
      action={action}
      value={memberCredentials}
      setValue={setMemberCredentials}
      valueDisplay={v => "pubkey: " + v.pubkey}
    />
  );
}
