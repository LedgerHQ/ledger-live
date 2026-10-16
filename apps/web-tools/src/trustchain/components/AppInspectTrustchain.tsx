import React, { useCallback, useState } from "react";
import type { StreamTree } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  JWT,
  MemberCredentials,
  TrustchainDeviceCallbacks,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { DisplayName } from "./IdentityManager";
import { describePermissions } from "./AppAgentIntentMembers";
import { useTrustchainSDK } from "../context";

type MemberData = { id: string; name: string; permissions: number };
export type StreamData = { path: string; closed: boolean; members: MemberData[] };
type TrustchainData = { rootId: string; streams: StreamData[] };

// Debug only: the SDK keeps the device login and the tree fetch private.
type SdkInternals = {
  api: { getTrustchains(jwt: JWT): Promise<Record<string, unknown>> };
  hwDeviceProvider: {
    withJwt<T>(
      deviceId: string,
      job: (jwt: JWT) => Promise<T>,
      policy?: "cache",
      callbacks?: TrustchainDeviceCallbacks,
    ): Promise<T>;
    clearJwt(): void;
  };
  fetchTrustchain(jwt: JWT, rootId: string): Promise<{ streamTree: StreamTree }>;
};

async function describeStreams(streamTree: StreamTree): Promise<StreamData[]> {
  const paths = Object.keys(streamTree.serialize()).sort();
  return Promise.all(
    paths.map(async path => {
      const stream = streamTree.getChild(path);
      if (!stream) return { path, closed: false, members: [] };
      const resolved = await stream.resolve();
      return {
        path,
        closed: resolved.isClosed(),
        members: resolved.getMembersData().map(m => ({
          id: m.id,
          name: m.name,
          permissions: m.permissions,
        })),
      };
    }),
  );
}

// Rethrows without the HTTP status so the SDK's JWT handling does not remap it.
const rawError = (call: string) => (e: { status?: number; name?: string; message?: string }) => {
  throw new Error(`${call} ${e?.status ?? ""} ${e?.name}: ${e?.message}`, { cause: e });
};

/**
 * Reads one trustchain's streams with the device login: app 18 refuses most software-member logins.
 */
export function useReadStreamsWithDevice(deviceId: string, callbacks?: TrustchainDeviceCallbacks) {
  const sdk = useTrustchainSDK() as unknown as SdkInternals;
  return useCallback(
    (rootId: string) => {
      let loggedIn = false;
      // Same sequence as the inspector, with the backend's raw replies instead of the SDK's mapped errors
      return sdk.hwDeviceProvider
        .withJwt(
          deviceId,
          async jwt => {
            loggedIn = true;
            const trustchains = await sdk.api.getTrustchains(jwt).catch(rawError("getTrustchains"));
            if (!(rootId in trustchains)) {
              throw new Error(
                `the device login does not list ${rootId}, only: ${Object.keys(trustchains).join(", ")}`,
              );
            }
            const { streamTree } = await sdk
              .fetchTrustchain(jwt, rootId)
              .catch(rawError("getTrustchain"));
            return describeStreams(streamTree);
          },
          "cache",
          callbacks,
        )
        .catch(e => {
          throw loggedIn ? e : new Error(`device login: ${e?.name}: ${e?.message}`, { cause: e });
        });
    },
    [sdk, deviceId, callbacks],
  );
}

/**
 * Lists every stream of every trustchain of the connected device's seed, authenticated with the device.
 */
export function AppInspectTrustchain({
  deviceId,
  memberCredentials,
  callbacks,
}: {
  deviceId: string;
  memberCredentials: MemberCredentials | null;
  callbacks?: TrustchainDeviceCallbacks;
}) {
  const sdk = useTrustchainSDK() as unknown as SdkInternals;
  const [trustchains, setTrustchains] = useState<TrustchainData[] | null>(null);

  const action = useCallback(
    (deviceId: string) =>
      sdk.hwDeviceProvider.withJwt(
        deviceId,
        async jwt => {
          const rootIds = Object.keys(await sdk.api.getTrustchains(jwt));
          return Promise.all(
            rootIds.map(async rootId => {
              const { streamTree } = await sdk.fetchTrustchain(jwt, rootId);
              return { rootId, streams: await describeStreams(streamTree) };
            }),
          );
        },
        "cache",
        callbacks,
      ),
    [sdk, callbacks],
  );

  return (
    <div className="my-8">
      <Actionable
        buttonTitle="inspect trustchain (device)"
        inputs={deviceId ? [deviceId] : null}
        action={action}
        value={trustchains}
        setValue={setTrustchains}
        valueDisplay={trustchains => `${trustchains.length} trustchain(s)`}
      />
      {trustchains?.map(({ rootId, streams }) => (
        <div key={rootId} className="pl-40 my-4">
          <code className="body-3">{rootId}</code>
          {streams.map(stream => (
            <div key={stream.path} className="pl-16 my-4">
              <div className="flex items-center gap-8">
                <code className="body-3">{stream.path}</code>
                {stream.closed ? <span className="body-3 text-muted">closed</span> : null}
              </div>
              {stream.members.map(member => (
                <div key={member.id} className="flex items-center gap-8 pl-16">
                  <DisplayName pubkey={member.id} overridesName={member.name} />
                  <code className="body-3 text-muted">
                    {describePermissions(member.permissions)}
                  </code>
                  {member.id === memberCredentials?.pubkey ? (
                    <span className="body-3 text-muted">(you)</span>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
