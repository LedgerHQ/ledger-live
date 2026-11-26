import { keyRingInitialState, keyRingReset } from "@domain/entity-key-ring";
import { mockKeyRingMemberKeyRecord } from "@domain/entity-key-ring/schema.mock";
import type { KeyRingAction } from "../types";
import { dispatchAnswer, findRuntime, runtimePartsOf, toRuntime } from "./runtime";
import { createV1Runtime } from "./v1/runtime";

const ACTION: KeyRingAction = keyRingReset(mockKeyRingMemberKeyRecord());

describe("dispatchAnswer", () => {
  it("should dispatch an answer given at once in the same tick", () => {
    const dispatch = jest.fn();

    const stored = dispatchAnswer(dispatch, ACTION);

    expect(dispatch).toHaveBeenCalledWith(ACTION);
    return expect(stored).resolves.toBeUndefined();
  });

  it("should await an answer given later, then dispatch it", async () => {
    const dispatch = jest.fn();
    const answer = jest.fn<Promise<KeyRingAction>, []>(() => Promise.resolve(ACTION));

    const stored = dispatchAnswer(dispatch, answer());
    expect(dispatch).not.toHaveBeenCalled();

    await stored;
    expect(dispatch).toHaveBeenCalledWith(ACTION);
  });
});

describe("the runtime handle", () => {
  it("should find the runtime of a thunk extra argument", () => {
    const runtime = toRuntime(createV1Runtime(() => keyRingInitialState));

    expect(findRuntime({ other: 1, keyRingRuntime: runtime })).toBe(runtime);
    expect(runtimePartsOf(runtime).keyStore).toBeDefined();
  });

  it("should not find a runtime this package did not build", () => {
    expect(findRuntime({ keyRingRuntime: { kind: "KeyRingRuntime" } })).toBeUndefined();
    expect(findRuntime(null)).toBeUndefined();
    expect(() => runtimePartsOf({ kind: "KeyRingRuntime" })).toThrow("Unknown key ring runtime");
  });
});
