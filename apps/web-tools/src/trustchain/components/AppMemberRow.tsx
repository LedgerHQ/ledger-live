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
import { useRemoveMemberWithDevice } from "./AppAgentIntentMembers";

export function AppMemberRow({
  deviceId,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setMembers,
  callbacks,
  removeWithDevice,
}: {
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setMembers: (members: TrustchainMember[] | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
  // App 18: the backend and the device only accept a device-signed rotation
  removeWithDevice?: boolean;
}) {
  const sdk = useTrustchainSDK();
  const rotateWithoutMember = useRemoveMemberWithDevice(deviceId, callbacks);

  const action = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      (removeWithDevice
        ? rotateWithoutMember(trustchain, memberCredentials, member)
        : sdk
            .removeMember(deviceId, trustchain, memberCredentials, member, callbacks)
            .then(async trustchain => ({
              trustchain,
              members: await sdk.getMembers(trustchain, memberCredentials),
            }))
      ).then(({ trustchain, members }) => {
        setTrustchain(trustchain);
        setMembers(members);
        return member;
      }),
    [
      deviceId,
      sdk,
      member,
      setTrustchain,
      setMembers,
      callbacks,
      removeWithDevice,
      rotateWithoutMember,
    ],
  );

  return (
    <div className="pl-40">
      <Actionable
        reverseRow
        buttonTitle={removeWithDevice ? "remove (device rotation)" : "sdk.removeMember"}
        inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
        action={action}
        value={member}
        valueDisplay={member => <DisplayName pubkey={member.id} overridesName={member.name} />}
      />
    </div>
  );
}
