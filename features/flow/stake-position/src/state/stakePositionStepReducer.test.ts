import { act, renderHook } from "@testing-library/react";
import {
  INITIAL_STAKE_POSITION_STEP,
  stakePositionStepReducer,
  type StakePositionStep,
  type StakePositionStepEvent,
} from "./stakePositionStepReducer";
import { useStakePositionSteps } from "./useStakePositionSteps";

const ERROR = new Error("broadcast failed");

describe("stakePositionStepReducer", () => {
  it.each<[string, StakePositionStep, StakePositionStepEvent, StakePositionStep]>([
    [
      "the details to the confirmation of the exit",
      { name: "details" },
      { type: "selectExit", action: "withdraw" },
      { name: "confirm", action: "withdraw" },
    ],
    [
      "the confirmation back to the details",
      { name: "confirm", action: "deactivate" },
      { type: "back" },
      { name: "details" },
    ],
    [
      "the confirmation to the signing",
      { name: "confirm", action: "deactivate" },
      { type: "confirm" },
      { name: "signing", action: "deactivate" },
    ],
    [
      "the signing to the broadcast once signed",
      { name: "signing", action: "deactivate" },
      { type: "signed" },
      { name: "broadcasting", action: "deactivate" },
    ],
    [
      "the signing to an unsigned failure",
      { name: "signing", action: "withdraw" },
      { type: "failed", error: ERROR },
      { name: "failure", action: "withdraw", error: ERROR, signed: false },
    ],
    [
      "the broadcast to the success",
      { name: "broadcasting", action: "withdraw" },
      { type: "broadcasted" },
      { name: "success", action: "withdraw" },
    ],
    [
      "the broadcast to a signed failure",
      { name: "broadcasting", action: "deactivate" },
      { type: "failed", error: ERROR },
      { name: "failure", action: "deactivate", error: ERROR, signed: true },
    ],
    [
      "a failure back to the confirmation of the same exit",
      { name: "failure", action: "withdraw", error: ERROR, signed: true },
      { type: "retry" },
      { name: "confirm", action: "withdraw" },
    ],
  ])("should move from %s", (_transition, step, event, next) => {
    expect(stakePositionStepReducer(step, event)).toEqual(next);
  });

  it.each<[string, StakePositionStep, StakePositionStepEvent]>([
    ["a confirmation on the details", { name: "details" }, { type: "confirm" }],
    [
      "a broadcast before the signature",
      { name: "signing", action: "deactivate" },
      { type: "broadcasted" },
    ],
    ["a back during the signing", { name: "signing", action: "deactivate" }, { type: "back" }],
    ["a back during the broadcast", { name: "broadcasting", action: "withdraw" }, { type: "back" }],
    [
      "a new exit on the confirmation",
      { name: "confirm", action: "deactivate" },
      { type: "selectExit", action: "withdraw" },
    ],
    ["a retry after the success", { name: "success", action: "withdraw" }, { type: "retry" }],
    [
      "a failure after the success",
      { name: "success", action: "withdraw" },
      { type: "failed", error: ERROR },
    ],
  ])("should ignore %s", (_event, step, event) => {
    expect(stakePositionStepReducer(step, event)).toBe(step);
  });
});

describe("useStakePositionSteps", () => {
  it("should start on the details and follow the events", () => {
    const { result } = renderHook(() => useStakePositionSteps());
    expect(result.current[0]).toBe(INITIAL_STAKE_POSITION_STEP);

    act(() => result.current[1]({ type: "selectExit", action: "deactivate" }));

    expect(result.current[0]).toEqual({ name: "confirm", action: "deactivate" });
  });
});
