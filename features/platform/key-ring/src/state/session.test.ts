import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { mockKeyRingMemberKeyRecord } from "@domain/entity-key-ring/schema.mock";
import { KeyRingMemberIdSchema } from "../schema";
import { KeyRingMemberRemovedError, keyRingErrorForDisplay } from "../errors";
import {
  assertKeyRingMember,
  hasKeyRingMemberKey,
  isCurrentKeyRingMember,
  isSameKeyRingMember,
  selectKeyRingSession,
} from "./session";

describe("selectKeyRingSession", () => {
  it("returns the same session until the slice changes", () => {
    const trustchain = mockKeyRingState();
    expect(selectKeyRingSession({ trustchain })).toBe(selectKeyRingSession({ trustchain }));
    expect(selectKeyRingSession({ trustchain })).not.toBe(
      selectKeyRingSession({ trustchain: { ...trustchain } }),
    );
  });

  it("exposes nothing of the state it stands for", () => {
    expect(Object.keys(selectKeyRingSession({ trustchain: mockKeyRingState() }))).toEqual(["kind"]);
  });
});

describe("isCurrentKeyRingMember", () => {
  it("recognises this instance by its member key", () => {
    const state = mockKeyRingState();
    const session = selectKeyRingSession({ trustchain: state });
    const self = KeyRingMemberIdSchema.parse(state.memberCredentials?.pubkey);
    const other = KeyRingMemberIdSchema.parse("other");

    expect(isCurrentKeyRingMember(session, self)).toBe(true);
    expect(isCurrentKeyRingMember(session, other)).toBe(false);
  });
});

describe("isSameKeyRingMember", () => {
  it("tells a reset apart from a key tree change", () => {
    const before = mockKeyRingState();
    const treeChanged = { ...before, trustchain: null };
    const reset = {
      trustchain: null,
      memberCredentials: mockKeyRingMemberKeyRecord({ pubkey: `03${"f".repeat(64)}` }),
    };
    const session = selectKeyRingSession({ trustchain: before });

    expect(isSameKeyRingMember(session, selectKeyRingSession({ trustchain: treeChanged }))).toBe(
      true,
    );
    expect(isSameKeyRingMember(session, selectKeyRingSession({ trustchain: reset }))).toBe(false);
  });
});

describe("assertKeyRingMember", () => {
  it("accepts a member instance", () => {
    expect(() =>
      assertKeyRingMember(selectKeyRingSession({ trustchain: mockKeyRingState() })),
    ).not.toThrow();
  });

  it("throws a member removed error otherwise, shown as the v1 one", () => {
    const session = selectKeyRingSession({ trustchain: mockKeyRingState({ trustchain: null }) });
    const failure = (() => {
      try {
        assertKeyRingMember(session);
      } catch (error) {
        return error;
      }
    })();
    expect(failure).toBeInstanceOf(KeyRingMemberRemovedError);
    expect(failure).toMatchObject({ message: "trustchain or memberCredentials is not set" });
    expect(keyRingErrorForDisplay(failure)).toMatchObject({
      name: "TrustchainEjected",
      message: "trustchain or memberCredentials is not set",
    });
  });
});

describe("hasKeyRingMemberKey", () => {
  it("tells a session with a member key from one without", () => {
    expect(hasKeyRingMemberKey(selectKeyRingSession({ trustchain: mockKeyRingState() }))).toBe(
      true,
    );
    expect(
      hasKeyRingMemberKey(
        selectKeyRingSession({ trustchain: mockKeyRingState({ memberCredentials: null }) }),
      ),
    ).toBe(false);
  });
});
