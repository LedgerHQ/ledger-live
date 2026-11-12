import { receiveGate, sendGate } from "./gates";
import { mockAccountStatus, mockAssetStatus } from "./schema.mock";

const onboarding = { type: "onboarding" } as const;
const unrevealed = { type: "activation", reason: "unrevealed" } as const;
const trustline = mockAssetStatus({ assetGate: { type: "activation", method: "trustline" } });
const unknown = mockAssetStatus({ assetGate: { type: "unknown" } });

describe("receiveGate", () => {
  it("should let a ready account receive its native coin", () => {
    expect(receiveGate(mockAccountStatus(), mockAssetStatus())).toBeNull();
  });

  it("should let a ready account receive when no asset is given", () => {
    expect(receiveGate(mockAccountStatus())).toBeNull();
  });

  it("should let an account receive before its activation", () => {
    expect(receiveGate(mockAccountStatus({ accountGate: unrevealed }))).toBeNull();
  });

  it("should stop an account before its onboarding, whatever the asset", () => {
    expect(receiveGate(mockAccountStatus({ accountGate: onboarding }), trustline)).toEqual(
      onboarding,
    );
  });

  it("should stop an account before the activation of the asset", () => {
    expect(receiveGate(mockAccountStatus(), trustline)).toEqual(trustline.assetGate);
  });

  it("should tell when the activation of the asset is unknown", () => {
    expect(receiveGate(mockAccountStatus(), unknown)).toEqual(unknown.assetGate);
  });
});

describe("sendGate", () => {
  it("should let a ready account send", () => {
    expect(sendGate(mockAccountStatus())).toBeNull();
  });

  it.each([onboarding, unrevealed])("should stop an account behind its %o gate", accountGate => {
    expect(sendGate(mockAccountStatus({ accountGate }))).toEqual(accountGate);
  });
});
