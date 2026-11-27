import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { CheckErrorCauseResult, type CheckErrorCauseStateMachineOutput } from "../types";
import { hasUnexplainedRecoveryAfter, isRepeatedUnexplainedRecovery } from "./unexplainedRecovery";

const CONNECTED_DEVICE = { sessionId: "session-id" } as ConnectedDevice;

const recovered = (isUnexplained: boolean): CheckErrorCauseStateMachineOutput => ({
  result: CheckErrorCauseResult.Recovered,
  connectedDevice: CONNECTED_DEVICE,
  isUnexplained,
});

const UNRECOVERABLE: CheckErrorCauseStateMachineOutput = {
  result: CheckErrorCauseResult.Unrecoverable,
};

describe("isRepeatedUnexplainedRecovery", () => {
  it("should flag a second unexplained recovery", () => {
    expect(isRepeatedUnexplainedRecovery(true, recovered(true))).toBe(true);
  });

  it("should let a first unexplained recovery through", () => {
    expect(isRepeatedUnexplainedRecovery(false, recovered(true))).toBe(false);
  });

  it("should let an explained recovery through after an unexplained one", () => {
    expect(isRepeatedUnexplainedRecovery(true, recovered(false))).toBe(false);
  });

  it("should leave an unrecoverable output to the host", () => {
    expect(isRepeatedUnexplainedRecovery(true, UNRECOVERABLE)).toBe(false);
  });
});

describe("hasUnexplainedRecoveryAfter", () => {
  it("should remember an unexplained recovery", () => {
    expect(hasUnexplainedRecoveryAfter(false, recovered(true))).toBe(true);
  });

  it("should keep remembering it across an explained recovery", () => {
    expect(hasUnexplainedRecoveryAfter(true, recovered(false))).toBe(true);
  });

  it("should not flag an explained recovery", () => {
    expect(hasUnexplainedRecoveryAfter(false, recovered(false))).toBe(false);
  });
});
