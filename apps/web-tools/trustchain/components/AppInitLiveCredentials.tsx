import React, { useCallback } from "react";
import { MemberCredentials } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppInitLiveCredentials({
  memberCredentials,
  setMemberCredentials,
}: {
  memberCredentials: MemberCredentials | null;
  setMemberCredentials: (memberCredentials: MemberCredentials | null) => void;
}) {
  const sdk = useTrustchainSDK();
  const action = useCallback(() => sdk.initMemberCredentials(), [sdk]);

  const valueDisplay = useCallback(
    (memberCredentials: MemberCredentials) => "pubkey: " + memberCredentials.pubkey,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.initMemberCredentials"
      inputs={[]}
      action={action}
      setValue={setMemberCredentials}
      value={memberCredentials}
      valueDisplay={valueDisplay}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "generates a new identity. priv/pub key are prerequisite to identify a member in Trustchain.",
      }}
    />
  );
}
