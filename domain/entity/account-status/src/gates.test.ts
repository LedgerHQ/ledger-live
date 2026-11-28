import { receiveGate, sendGate } from "./gates";
import { mockAccountStatus, mockAssetStatus } from "./schema.mock";

const onboarding = { type: "onboarding" } as const;
const toActivate = mockAssetStatus({ gate: { type: "activation" } });

describe("receiveGate", () => {
  it("should let a ready account receive its native coin", () => {
    expect(receiveGate(mockAccountStatus(), mockAssetStatus())).toBeNull();
  });

  it("should let a ready account receive when no asset is given", () => {
    expect(receiveGate(mockAccountStatus())).toBeNull();
  });

  it("should stop an account before its onboarding, whatever the asset", () => {
    expect(receiveGate(mockAccountStatus({ gate: onboarding }), toActivate)).toEqual(onboarding);
  });

  it("should stop an account before the activation of the asset", () => {
    expect(receiveGate(mockAccountStatus(), toActivate)).toEqual(toActivate.gate);
  });
});

describe("sendGate", () => {
  it("should let a ready account send", () => {
    expect(sendGate(mockAccountStatus())).toBeNull();
  });

  it("should stop an account before its onboarding", () => {
    expect(sendGate(mockAccountStatus({ gate: onboarding }))).toEqual(onboarding);
  });
});
