import {
  toReceiveAddressLeaveEnding,
  toReceiveAddressProgress,
  toReceiveAddressRetryEnding,
  type ReceiveAddressScreen,
} from "./receiveAddressOperationSteps";

const LOADING: ReceiveAddressScreen = {
  type: "loading",
  isSelecting: false,
  pickedOptionId: undefined,
  sanctionStatus: "checking",
  hasServiceIncident: false,
  failedKinds: undefined,
  readError: undefined,
};
const SHOWN: ReceiveAddressScreen = {
  ...LOADING,
  type: "ready",
  pickedOptionId: "transparent",
  sanctionStatus: "clear",
};
const READ_FAILED: ReceiveAddressScreen = {
  ...LOADING,
  type: "error",
  failedKinds: "receive,assetStatus",
  readError: { name: "NetworkDown", message: "sync failed" },
};
const ACCOUNT_MISSING: ReceiveAddressScreen = {
  ...LOADING,
  type: "error",
  failedKinds: "account",
};
const FIRST_ATTEMPT = { wasGated: false, gateActionOpened: false };

describe("toReceiveAddressProgress", () => {
  it("should not end the attempt while the screen loads", () => {
    expect(toReceiveAddressProgress(LOADING, FIRST_ATTEMPT)).toEqual({
      annotations: {},
      wasGated: false,
      ending: undefined,
    });
  });

  it("should not end the attempt on a read error, which may still recover", () => {
    expect(toReceiveAddressProgress(READ_FAILED, FIRST_ATTEMPT).ending).toBeUndefined();
  });

  it("should note the address choice while the options are shown", () => {
    const choosing = { ...LOADING, type: "ready" as const, isSelecting: true };

    expect(toReceiveAddressProgress(choosing, FIRST_ATTEMPT).annotations).toEqual({
      step: "selecting",
      has_address_choice: true,
    });
  });

  it("should remember a gate seen during the attempt", () => {
    const gated = { ...LOADING, type: "activationRequired" as const };

    expect(toReceiveAddressProgress(gated, FIRST_ATTEMPT).wasGated).toBe(true);
  });

  it("should succeed with the option and the service incident once the address is shown", () => {
    expect(toReceiveAddressProgress(SHOWN, FIRST_ATTEMPT).ending).toEqual({
      type: "succeed",
      attributes: { address_option: "transparent", service_incident: false },
    });
  });

  it("should tell the gate was resolved when the address is shown after it", () => {
    const afterGate = { ...FIRST_ATTEMPT, wasGated: true };

    expect(toReceiveAddressProgress(SHOWN, afterGate).ending?.attributes).toEqual(
      expect.objectContaining({ gate_resolved: true }),
    );
  });

  it("should wait for the sanctions check before the address counts as shown", () => {
    const checking = { ...SHOWN, sanctionStatus: "checking" as const };

    expect(toReceiveAddressProgress(checking, FIRST_ATTEMPT).ending).toBeUndefined();
  });

  it("should succeed as sanctioned when the picked address is on the sanctions list", () => {
    const sanctioned = { ...SHOWN, sanctionStatus: "sanctioned" as const };

    expect(toReceiveAddressProgress(sanctioned, FIRST_ATTEMPT).ending).toEqual({
      type: "succeed",
      attributes: { outcome: "sanctioned" },
    });
  });
});

describe("toReceiveAddressLeaveEnding", () => {
  it.each([
    { step: "loading", screen: LOADING },
    { step: "selecting", screen: { ...LOADING, type: "ready" as const, isSelecting: true } },
    { step: "checking_sanction", screen: { ...SHOWN, sanctionStatus: "checking" as const } },
  ])("should be abandoned at the $step step", ({ step, screen }) => {
    expect(toReceiveAddressLeaveEnding(screen, "close", FIRST_ATTEMPT)).toEqual({
      type: "fail",
      reason: "ABANDONED",
      attributes: { trigger: "close", step },
    });
  });

  it.each([
    { type: "onboardingRequired" as const, outcome: "onboarding_required" },
    { type: "activationRequired" as const, outcome: "activation_required" },
  ])("should succeed as $outcome when leaving on the gate", ({ type, outcome }) => {
    expect(
      toReceiveAddressLeaveEnding({ ...LOADING, type }, "unmount", {
        wasGated: true,
        gateActionOpened: true,
      }),
    ).toEqual({ type: "succeed", attributes: { outcome, gate_action_opened: true } });
  });

  it.each(["close", "unmount"] as const)(
    "should fail as an error with the read failure when leaving on the error (%s)",
    trigger => {
      expect(toReceiveAddressLeaveEnding(READ_FAILED, trigger, FIRST_ATTEMPT)).toEqual({
        type: "fail",
        reason: "ERROR",
        attributes: expect.objectContaining({
          trigger,
          failed_kinds: "receive,assetStatus",
          error_name: "NetworkDown",
          error_message: "sync failed",
        }),
      });
    },
  );

  it("should name the missing account when the account model does not hold it", () => {
    expect(toReceiveAddressLeaveEnding(ACCOUNT_MISSING, "close", FIRST_ATTEMPT)).toEqual({
      type: "fail",
      reason: "ERROR",
      attributes: { trigger: "close", failed_kinds: "account", error_name: "AccountNotFound" },
    });
  });
});

describe("toReceiveAddressRetryEnding", () => {
  it("should fail the attempt as an error with the read failure the user retries", () => {
    expect(toReceiveAddressRetryEnding(READ_FAILED)).toEqual({
      type: "fail",
      reason: "ERROR",
      attributes: expect.objectContaining({
        trigger: "retry",
        failed_kinds: "receive,assetStatus",
        error_name: "NetworkDown",
      }),
    });
  });
});
