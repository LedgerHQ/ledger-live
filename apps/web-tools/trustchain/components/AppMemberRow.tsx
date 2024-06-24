import React, { useCallback } from "react";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { DisplayName } from "./IdentityManager";
import { useTrustchainSDK } from "../context";
import { runWithDevice } from "../device";

export function AppMemberRow({
  deviceId,
  deviceJWT,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setDeviceJWT,
  setMembers,
}: {
  deviceId: string;
  deviceJWT: JWT | null;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (trustchain: Trustchain | null) => void;
  setDeviceJWT: (deviceJWT: JWT | null) => void;
  setMembers: (members: TrustchainMember[] | null) => void;
}) {
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (deviceJWT: JWT, trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      runWithDevice(deviceId, transport =>
        sdk.removeMember(transport, deviceJWT, trustchain, memberCredentials, member),
      ).then(async ({ jwt, trustchain }) => {
        setDeviceJWT(jwt);
        setTrustchain(trustchain);
        await sdk.getMembers(jwt, trustchain).then(setMembers);
        return member;
      }),
    [deviceId, sdk, member, setTrustchain, setDeviceJWT, setMembers],
  );

  return (
    <div style={{ paddingLeft: 140 }}>
      <Actionable
        reverseRow
        buttonTitle="sdk.removeMember"
        inputs={
          deviceJWT && trustchain && memberCredentials
            ? [deviceJWT, trustchain, memberCredentials]
            : null
        }
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
