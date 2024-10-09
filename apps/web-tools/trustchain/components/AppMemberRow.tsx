import React, { useCallback } from "react";
import {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { DisplayName } from "./IdentityManager";
import { useTrustchainSDK } from "../context";

export function AppMemberRow({
  deviceId,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setMembers,
  callbacks,
}: {
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setMembers: (members: TrustchainMember[] | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      sdk
        .removeMember(deviceId, trustchain, memberCredentials, member, callbacks)
        .then(async trustchain => {
          setTrustchain(trustchain);
          await sdk.getMembers(trustchain, memberCredentials).then(setMembers);
          return member;
        }),
    [deviceId, sdk, member, setTrustchain, setMembers, callbacks],
  );

  return (
    <div style={{ paddingLeft: 140 }}>
      <Actionable
        reverseRow
        buttonTitle="sdk.removeMember"
        inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
        action={action}
        value={member}
        valueDisplay={member => <DisplayName pubkey={member.id} overridesName={member.name} />}
        buttonProps={{
          "data-tooltip-id": "tooltip",
          "data-tooltip-content":
            "removes a member from the app trustchain & rotates the derivation. (device required)",
        }}
      />
    </div>
  );
}
