import React, { useCallback } from "react";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { DisplayName } from "./IdentityManager";
import { useTrustchainSDK } from "../context";
import { runWithDevice } from "../device";

export function AppMemberRow({
  deviceId,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setMembers,
}: {
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setMembers: (members: TrustchainMember[] | null) => void;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      runWithDevice(deviceId, transport =>
        sdk.removeMember(transport, trustchain, memberCredentials, member),
      ).then(async trustchain => {
        setTrustchain(trustchain);
        await sdk.getMembers(trustchain, memberCredentials).then(setMembers);
        return member;
      }),
    [deviceId, sdk, member, setTrustchain, setMembers],
  );

  return (
    <div style={{ paddingLeft: 140 }}>
      <Actionable
        reverseRow
        buttonTitle="sdk.removeMember"
        inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
        action={action}
        value={member}
        valueDisplay={member => <DisplayName pubkey={member.id} />}
        buttonProps={{
          "data-tooltip-id": "tooltip",
          "data-tooltip-content":
            "removes a member from the app trustchain & rotates the derivation. (device required)",
        }}
      />
    </div>
  );
}
