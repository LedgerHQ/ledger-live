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
import { useReadStreamsWithDevice } from "./AppInspectTrustchain";

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

type Props = {
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  setMembers: (members: TrustchainMember[] | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
};

/** Members of the trustchain's application stream, read with the device login. */
export function useReadMembersWithDevice(deviceId: string, callbacks?: TrustchainDeviceCallbacks) {
  const readStreams = useReadStreamsWithDevice(deviceId, callbacks);
  return useCallback(
    async (trustchain: Trustchain): Promise<TrustchainMember[]> => {
      const streams = await readStreams(trustchain.rootId);
      const app = streams.find(s => s.path === trustchain.applicationPath);
      if (!app) throw new Error(`application stream ${trustchain.applicationPath} was not found`);
      return app.members;
    },
    [readStreams],
  );
}

const step = <T,>(name: string, job: () => Promise<T>): Promise<T> =>
  job().catch(e => {
    throw new Error(`${name}: ${e?.message ?? e}`, { cause: e });
  });

/**
 * Removes an app stream member by rotating the stream: the device derives the next stream with us,
 * re-adds the other members, then closes the current one.
 */
export function useRemoveMemberWithDevice(deviceId: string, callbacks?: TrustchainDeviceCallbacks) {
  const sdk = useTrustchainSDK();
  const readMembers = useReadMembersWithDevice(deviceId, callbacks);
  return useCallback(
    async (
      trustchain: Trustchain,
      memberCredentials: MemberCredentials,
      member: TrustchainMember,
    ): Promise<{ trustchain: Trustchain; members: TrustchainMember[] }> => {
      if (member.id === memberCredentials.pubkey) {
        throw new Error("the rotation keeps the current member: remove it from another member");
      }
      const members = await step("read app stream", () => readMembers(trustchain));
      const me = members.find(m => m.id === memberCredentials.pubkey);
      if (!me) throw new Error("current member is not in the application stream");
      const next = await step("prepare next app stream", () =>
        sdk.prepareApplicationStreamRotationWithHardware(
          deviceId,
          trustchain,
          memberCredentials,
          me,
          callbacks,
        ),
      );
      for (const m of members) {
        if (m.id === me.id || m.id === member.id) continue;
        await step(`re-add ${m.name}`, () =>
          sdk.addMemberToApplicationWithHardware(deviceId, next, m, callbacks),
        );
      }
      await step("close previous app stream", () =>
        sdk.closeApplicationStreamWithHardware(deviceId, trustchain, callbacks),
      );
      return {
        trustchain: next,
        members: await step("read next app stream", () => readMembers(next)),
      };
    },
    [sdk, deviceId, callbacks, readMembers],
  );
}

/**
 * App 18 subtrees and device-signed member add: the software member has no CAN_ADD_BLOCK.
 */
export function AppAgentIntentMembers({
  deviceId,
  trustchain,
  memberCredentials,
  setMembers,
  callbacks,
}: Props) {
  const sdk = useTrustchainSDK();
  const readStreams = useReadStreamsWithDevice(deviceId, callbacks);
  const readMembers = useReadMembersWithDevice(deviceId, callbacks);
  const [subtrees, setSubtrees] = useState<TrustchainSubtree[] | null>(null);

  useEffect(() => {
    setSubtrees(null);
  }, [trustchain, memberCredentials]);

  const getSubtrees = useCallback(
    (trustchain: Trustchain) =>
      readStreams(trustchain.rootId).then(streams =>
        streams.filter(s => s.path.startsWith(`${trustchain.applicationPath}/`)),
      ),
    [readStreams],
  );

  const closeSubtree = useCallback(
    async (trustchain: Trustchain, path: string) => {
      await sdk.closeSubtreeWithHardware(deviceId, trustchain, path, callbacks);
      setSubtrees(await getSubtrees(trustchain));
      return path;
    },
    [sdk, deviceId, callbacks, getSubtrees],
  );

  const onAdded = useCallback(
    (trustchain: Trustchain) => readMembers(trustchain).then(setMembers),
    [readMembers, setMembers],
  );

  return (
    <>
      <AppAgentIntentAddMember
        deviceId={deviceId}
        trustchain={trustchain}
        memberCredentials={memberCredentials}
        callbacks={callbacks}
        onAdded={onAdded}
      />

      <Actionable
        buttonTitle="getSubtrees (device)"
        inputs={trustchain ? [trustchain] : null}
        action={getSubtrees}
        value={subtrees}
        setValue={setSubtrees}
        valueDisplay={subtrees => `${subtrees.length} subtree(s)`}
      />

      {subtrees?.map(subtree => (
        <StreamMembers
          key={subtree.path}
          stream={subtree}
          headerAction={
            subtree.closed ? null : (
              <Actionable
                buttonTitle="sdk.closeSubtreeWithHardware"
                inputs={trustchain ? [trustchain, subtree.path] : null}
                action={closeSubtree}
              />
            )
          }
        />
      ))}
    </>
  );
}

function StreamMembers({
  stream,
  headerAction,
}: {
  stream: TrustchainSubtree;
  headerAction?: React.ReactNode;
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
