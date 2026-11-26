import { keyRingInitialState } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  createKeyRingDebugSdk,
  selectDebugKeyRingMemberKey,
  selectDebugKeyRingTree,
  setDebugKeyRingMemberKey,
  setDebugKeyRingTree,
} from "./devtools";
import { createKeyRingV1DeviceBridge } from "./v1";
import {
  mockKeyRingMemberKeyRecord,
  mockKeyRingTreeRecord,
} from "@domain/entity-key-ring/schema.mock";

describe("createKeyRingDebugSdk", () => {
  it("builds the protocol SDK on the device access of the bridge", () => {
    const sdk = createKeyRingDebugSdk({
      apiBaseUrl: "https://trustchain.test",
      deviceBridge: createKeyRingV1DeviceBridge({
        withDevice: jest.fn(),
        createSessionTransport: jest.fn(),
      }),
    });
    expect(sdk.getOrCreateTrustchain).toBeInstanceOf(Function);
  });
});

describe("debug setters", () => {
  it("store the key tree and the member key the debug tool established", () => {
    const tree = mockKeyRingTreeRecord();
    const memberKey = mockKeyRingMemberKeyRecord();
    expect(setDebugKeyRingTree(tree)).toEqual({ type: "trustchain/keyRingTreeSet", payload: tree });
    expect(setDebugKeyRingMemberKey(memberKey)).toEqual({
      type: "trustchain/keyRingMemberKeySet",
      payload: memberKey,
    });
  });
});

describe("debug readers", () => {
  it("read the raw key tree and member key of the slice", () => {
    const state = mockKeyRingState();
    expect(selectDebugKeyRingTree({ trustchain: state })).toBe(state.trustchain);
    expect(selectDebugKeyRingMemberKey({ trustchain: state })).toBe(state.memberCredentials);
  });

  it("read null on a fresh instance", () => {
    expect(selectDebugKeyRingTree({ trustchain: keyRingInitialState })).toBeNull();
    expect(selectDebugKeyRingMemberKey({ trustchain: keyRingInitialState })).toBeNull();
  });
});
