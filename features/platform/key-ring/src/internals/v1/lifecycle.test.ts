import type { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  mockKeyRingMemberKeyRecord,
  mockKeyRingTreeRecord,
} from "@domain/entity-key-ring/schema.mock";
import type { KeyRingStream } from "../../types";
import { createLifecycleHub } from "../lifecycleHub";
import { v1Lifecycle } from "./lifecycle";

const OLD_TREE = mockKeyRingTreeRecord({ applicationPath: "m/0'/16'/0'" });
const NEW_TREE = mockKeyRingTreeRecord({ applicationPath: "m/0'/16'/1'" });
const MEMBER_KEY = mockKeyRingMemberKeyRecord();

function fakeSdk() {
  return {
    withAuth: jest.fn((_tree, _key, job) => job({ accessToken: "token" })),
    encryptUserData: jest.fn(async () => new Uint8Array([1])),
    decryptUserData: jest.fn(async () => new Uint8Array([2])),
  } as unknown as TrustchainSDK & Record<"withAuth" | "encryptUserData", jest.Mock>;
}

describe("v1Lifecycle", () => {
  it("runs every registered handler on the old stream, then on the new one, then emits", async () => {
    const hub = createLifecycleHub();
    const sdk = fakeSdk();
    const calls: string[] = [];
    const seen: KeyRingStream[] = [];
    for (const label of ["first", "second"]) {
      hub.onKeyRotation(async previous => {
        calls.push(`${label}:before`);
        seen.push(previous);
        await previous.withAuth(async token => token, "refresh");
        return async next => {
          calls.push(`${label}:after`);
          seen.push(next);
          await next.encrypt(new Uint8Array([0]));
        };
      });
    }
    const listener = jest.fn();
    hub.subscribe(listener);

    const afterRotation = await v1Lifecycle(hub).onTrustchainRotation(sdk, OLD_TREE, MEMBER_KEY);
    expect(calls).toEqual(["first:before", "second:before"]);
    expect(listener).not.toHaveBeenCalled();

    await afterRotation(NEW_TREE);
    expect(calls).toEqual(["first:before", "second:before", "first:after", "second:after"]);
    expect(seen.map(stream => stream.ref.streamPath)).toEqual([
      "m/0'/16'/0'",
      "m/0'/16'/0'",
      "m/0'/16'/1'",
      "m/0'/16'/1'",
    ]);
    expect(sdk.withAuth).toHaveBeenCalledWith(
      OLD_TREE,
      MEMBER_KEY,
      expect.any(Function),
      "refresh",
    );
    expect(sdk.encryptUserData).toHaveBeenCalledWith(NEW_TREE, new Uint8Array([0]));
    expect(listener).toHaveBeenCalledWith({
      type: "key-rotated",
      tree: { treeId: NEW_TREE.rootId, streamPath: NEW_TREE.applicationPath },
    });
  });

  it("does nothing but emit when no handler is registered", async () => {
    const hub = createLifecycleHub();
    const sdk = fakeSdk();
    const afterRotation = await v1Lifecycle(hub).onTrustchainRotation(sdk, OLD_TREE, MEMBER_KEY);
    await afterRotation(NEW_TREE);
    expect(sdk.withAuth).not.toHaveBeenCalled();
    expect(sdk.encryptUserData).not.toHaveBeenCalled();
  });

  it("lets a handler failure fail the rotation, as the v1 lifecycle did", async () => {
    const hub = createLifecycleHub();
    hub.onKeyRotation(async () => {
      throw new Error("delete failed");
    });
    await expect(
      v1Lifecycle(hub).onTrustchainRotation(fakeSdk(), OLD_TREE, MEMBER_KEY),
    ).rejects.toThrow("delete failed");
  });
});
