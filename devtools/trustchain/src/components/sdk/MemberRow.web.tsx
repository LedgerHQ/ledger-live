import { useCallback, useState } from "react";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
  TrustchainSDK,
} from "../../types";
import { Actionable } from "../Actionable";

export function MemberRow({
  sdk,
  deviceId,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setMembers,
  callbacks,
}: Readonly<{
  sdk: TrustchainSDK;
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (v: Trustchain | null) => void;
  setMembers: (v: TrustchainMember[] | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}>) {
  const [removed, setRemoved] = useState<TrustchainMember | null>(null);

  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) =>
      sdk.removeMember(deviceId, tc, mc, member, callbacks).then(async updated => {
        setTrustchain(updated);
        await sdk.getMembers(updated, mc).then(setMembers);
        return member;
      }),
    [sdk, deviceId, member, callbacks, setTrustchain, setMembers],
  );

  return (
    <div className="flex items-center gap-12 px-16 py-10 border-b border-base body-3">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <span className="body-3-semi-bold truncate">{member.name || "(no name)"}</span>
        <code className="body-3 text-muted truncate">{member.id}</code>
        <span className="body-3 text-muted">permissions: {member.permissions}</span>
      </div>
      <Actionable
        buttonTitle="Remove"
        inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
        action={action}
        value={removed}
        setValue={setRemoved}
        valueDisplay={v => `removed: ${v.name || v.id.slice(0, 8)}`}
      />
    </div>
  );
}
