import { keyRingInitialState } from "@domain/entity-key-ring";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import {
  KeyRingMemberSchema,
  createKeyRingClient,
  keyRingRuntimeExtra,
  type KeyRingMember,
  type KeyRingRuntime,
  type KeyRingStream,
  type KeyRingTreeUpdate,
} from "@features/platform-key-ring";
import { keyRingTreeUpdateFixture } from "@features/platform-key-ring/testing";
import { createKeyRingV1DeviceBridge } from "@features/platform-key-ring/v1";

/** A key tree other than the one in the store, as a client returns it. */
export function newTreeUpdate(rootId = "new-root-id"): KeyRingTreeUpdate {
  return keyRingTreeUpdateFixture(mockKeyRingTreeRecord({ rootId }));
}

/** A members list entry. */
export function member(id: string, name = `Instance ${id}`): KeyRingMember {
  return KeyRingMemberSchema.parse({ id, name });
}

/** A key tree stream whose operations the hooks under test never call. */
export function fakeStream(treeId = "mock-root-id", streamPath = "m/0'/16'/0'"): KeyRingStream {
  return {
    ref: { treeId, streamPath },
    withAuth: () => Promise.reject(new Error("withAuth not used")),
    encrypt: () => Promise.reject(new Error("encrypt not used")),
    decrypt: () => Promise.reject(new Error("decrypt not used")),
  };
}

/** A key ring runtime on the state of a fresh instance, for a client built outside a store. */
export function freshKeyRingRuntime(): KeyRingRuntime {
  return keyRingRuntimeExtra({ getState: () => ({ trustchain: keyRingInitialState }) })
    .keyRingRuntime;
}

/** A real mock-environment client: the only source of member key updates the store accepts. */
export function mockEnvironmentKeyRingClient() {
  return createKeyRingClient({
    mock: true,
    instanceName: "Test instance",
    apiBaseUrl: "https://trustchain.test",
    runtime: freshKeyRingRuntime(),
    deviceBridge: createKeyRingV1DeviceBridge({
      withDevice: () => () => {
        throw new Error("no device in the mock environment");
      },
      createSessionTransport: () => {
        throw new Error("no device in the mock environment");
      },
    }),
  });
}

/** A promise the test settles. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(settle => {
    resolve = settle;
  });
  return { promise, resolve };
}
