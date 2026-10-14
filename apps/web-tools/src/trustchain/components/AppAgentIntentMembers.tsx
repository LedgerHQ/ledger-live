import React, { useCallback, useEffect, useState } from "react";
import {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
  TrustchainSubtree,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { DisplayName } from "./IdentityManager";
import { useTrustchainSDK } from "../context";

// Ledger Sync device firmware only lets app 18 add members with these permissions.
export const AGENT_INTENT_MEMBER_PERMISSIONS = 0x03;
const PERMISSION_OPTIONS = [AGENT_INTENT_MEMBER_PERMISSIONS, 0x00];

const PERMISSION_BITS: [number, string][] = [
  [0x01, "CAN_ENCRYPT"],
  [0x02, "CAN_DERIVE"],
  [0x04, "CAN_ADD_BLOCK"],
];

export function describePermissions(permissions: number): string {
  const hex = `0x${(permissions >>> 0).toString(16)}`;
  if (permissions >>> 0 === 0xffffffff) return `${hex} OWNER`;
  const names = PERMISSION_BITS.filter(([bit]) => permissions & bit).map(([, name]) => name);
  const known = PERMISSION_BITS.reduce((acc, [bit]) => acc | bit, 0);
  if (permissions & ~known) names.push("…");
  return names.length ? `${hex} ${names.join("|")}` : `${hex} none`;
}

type Streams = { app: TrustchainSubtree | undefined; subtrees: TrustchainSubtree[] };

type Props = {
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
};

/**
 * App 18 members management: the software member has no CAN_ADD_BLOCK,
 * so every mutation is signed by the device.
 */
export function AppAgentIntentMembers({
  deviceId,
  trustchain,
  memberCredentials,
  setTrustchain,
  callbacks,
}: Props) {
  const sdk = useTrustchainSDK();
  const [streams, setStreams] = useState<Streams | null>(null);

  useEffect(() => {
    setStreams(null);
  }, [trustchain, memberCredentials]);

  const fetchStreams = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<Streams> => {
      const options = { ignorePermissionsChecks: true };
      return Promise.all([
        sdk.getApplicationStreamState(trustchain, memberCredentials, options),
        sdk.getSubtrees(trustchain, memberCredentials, options),
      ]).then(([app, subtrees]) => ({ app, subtrees }));
    },
    [sdk],
  );

  const refresh = useCallback(
    (trustchain: Trustchain, memberCredentials: MemberCredentials) =>
      fetchStreams(trustchain, memberCredentials).then(setStreams),
    [fetchStreams],
  );

  // Rotate the app stream without `member`: the device derives the next stream with us,
  // re-adds the other members, then closes the current one.
  const removeAppMember = useCallback(
    async (
      trustchain: Trustchain,
      memberCredentials: MemberCredentials,
      member: TrustchainMember,
    ) => {
      const app = await sdk.getApplicationStreamState(trustchain, memberCredentials, {
        ignorePermissionsChecks: true,
      });
      const me = app?.members.find(m => m.id === memberCredentials.pubkey);
      if (!app || !me) throw new Error("current member is not in the application stream");
      const next = await sdk.prepareApplicationStreamRotationWithHardware(
        deviceId,
        trustchain,
        memberCredentials,
        me,
        callbacks,
      );
      for (const m of app.members) {
        if (m.id === me.id || m.id === member.id) continue;
        await sdk.addMemberToApplicationWithHardware(deviceId, next, m, callbacks);
      }
      await sdk.closeApplicationStreamWithHardware(deviceId, trustchain, callbacks);
      setTrustchain(next);
      await refresh(next, memberCredentials);
      return member;
    },
    [sdk, deviceId, callbacks, setTrustchain, refresh],
  );

  const closeSubtree = useCallback(
    async (trustchain: Trustchain, memberCredentials: MemberCredentials, path: string) => {
      await sdk.closeSubtreeWithHardware(deviceId, trustchain, path, callbacks);
      await refresh(trustchain, memberCredentials);
      return path;
    },
    [sdk, deviceId, callbacks, refresh],
  );

  const inputs: [Trustchain, MemberCredentials] | null =
    trustchain && memberCredentials ? [trustchain, memberCredentials] : null;

  return (
    <div className="my-8">
      <Actionable
        buttonTitle="sdk.getSubtrees"
        inputs={inputs}
        action={fetchStreams}
        value={streams}
        setValue={setStreams}
        valueDisplay={({ app, subtrees }) =>
          `${app?.members.length ?? 0} app stream member(s), ${subtrees.length} subtree(s)`
        }
      />

      {streams?.app ? (
        <StreamMembers
          stream={streams.app}
          renderAction={member =>
            streams.app?.closed || member.id === memberCredentials?.pubkey ? null : (
              <Actionable
                buttonTitle="remove (device rotation)"
                inputs={
                  trustchain && memberCredentials ? [trustchain, memberCredentials, member] : null
                }
                action={removeAppMember}
              />
            )
          }
        />
      ) : null}

      {streams?.subtrees.map(subtree => (
        <StreamMembers
          key={subtree.path}
          stream={subtree}
          headerAction={
            subtree.closed ? null : (
              <Actionable
                buttonTitle="sdk.closeSubtreeWithHardware"
                inputs={
                  trustchain && memberCredentials
                    ? [trustchain, memberCredentials, subtree.path]
                    : null
                }
                action={closeSubtree}
              />
            )
          }
        />
      ))}

      {streams?.app && streams.subtrees.length ? (
        <p className="body-3 text-muted pl-40">
          Removing an app stream member rotates to a new app stream: subtrees above stay under the
          closed one.
        </p>
      ) : null}

      <AppAgentIntentAddMember
        deviceId={deviceId}
        trustchain={trustchain}
        memberCredentials={memberCredentials}
        callbacks={callbacks}
        onAdded={refresh}
      />
    </div>
  );
}

function StreamMembers({
  stream,
  headerAction,
  renderAction,
}: {
  stream: TrustchainSubtree;
  headerAction?: React.ReactNode;
  renderAction?: (member: TrustchainMember) => React.ReactNode;
}) {
  return (
    <div className="pl-40 my-4">
      <div className="flex items-center gap-8">
        <code className="body-3">{stream.path}</code>
        {stream.closed ? <span className="body-3 text-muted">closed</span> : null}
        {headerAction}
      </div>
      {stream.members.map(member => (
        <div key={member.id} className="flex items-center gap-8 pl-16">
          <DisplayName pubkey={member.id} overridesName={member.name} />
          <code className="body-3 text-muted">{describePermissions(member.permissions)}</code>
          {renderAction?.(member)}
        </div>
      ))}
    </div>
  );
}

function AppAgentIntentAddMember({
  deviceId,
  trustchain,
  memberCredentials,
  callbacks,
  onAdded,
}: {
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  callbacks?: TrustchainDeviceCallbacks;
  onAdded: (trustchain: Trustchain, memberCredentials: MemberCredentials) => Promise<void>;
}) {
  const sdk = useTrustchainSDK();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState(AGENT_INTENT_MEMBER_PERMISSIONS);
  const [added, setAdded] = useState<string | null>(null);

  const action = useCallback(
    async (trustchain: Trustchain, memberCredentials: MemberCredentials) => {
      const member = { id: id.trim().toLowerCase(), name: name.trim(), permissions };
      const path = await sdk.addMemberToApplicationWithHardware(
        deviceId,
        trustchain,
        member,
        callbacks,
      );
      await onAdded(trustchain, memberCredentials);
      return `${member.name} added at ${path}`;
    },
    [sdk, deviceId, callbacks, id, name, permissions, onAdded],
  );

  const valid = /^[0-9a-fA-F]{66}$/.test(id.trim()) && name.trim().length > 0;

  return (
    <Actionable
      buttonTitle="sdk.addMemberToApplicationWithHardware"
      inputs={trustchain && memberCredentials && valid ? [trustchain, memberCredentials] : null}
      action={action}
      value={added}
      setValue={setAdded}
      valueDisplay={v => v}
    >
      <input
        className="flex-1 bg-base border border-base rounded-md px-8 py-6 body-3 text-base"
        placeholder="member pubkey (hex)"
        value={id}
        onChange={e => setId(e.target.value)}
      />
      <input
        className="flex-1 bg-base border border-base rounded-md px-8 py-6 body-3 text-base"
        placeholder="name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <select
        className="bg-base border border-base rounded-md px-8 py-6 body-3 text-base"
        value={permissions}
        onChange={e => setPermissions(Number(e.target.value))}
      >
        {PERMISSION_OPTIONS.map(p => (
          <option key={p} value={p}>
            {describePermissions(p)}
          </option>
        ))}
      </select>
    </Actionable>
  );
}
