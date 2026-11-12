import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { resolveReceiveBlock } from "../resolveReceiveBlock";

const receive = mockAccountReceive();
const settled = {
  receive,
  gate: null,
  pending: false,
  error: undefined,
  isAssetStatusPending: false,
  hasReturnedFromActivation: false,
  isSanctioned: false,
};

describe("resolveReceiveBlock", () => {
  it("shows the address once it is read and nothing stops receiving", () => {
    expect(resolveReceiveBlock(settled)).toEqual({ isLoadingAddress: false });
  });

  it("waits for the statuses before saying anything", () => {
    expect(resolveReceiveBlock({ ...settled, gate: undefined })).toEqual({
      isLoadingAddress: true,
    });
  });

  it("waits for the address once nothing stops receiving", () => {
    expect(resolveReceiveBlock({ ...settled, receive: undefined })).toEqual({
      isLoadingAddress: true,
    });
  });

  it("blocks an account to onboard, whose address read fails", () => {
    expect(
      resolveReceiveBlock({
        ...settled,
        receive: undefined,
        gate: { type: "onboarding" },
        error: new Error("no party id"),
      }).blockedReason,
    ).toBe("onboardingRequired");
  });

  it("offers a retry when a read the screen needs failed", () => {
    expect(
      resolveReceiveBlock({ ...settled, gate: undefined, error: new Error("down") }).blockedReason,
    ).toBe("readFailed");
  });

  it("does not report a failure while a read is still in flight", () => {
    expect(
      resolveReceiveBlock({ ...settled, gate: undefined, error: new Error("down"), pending: true }),
    ).toEqual({ isLoadingAddress: true });
  });

  it("asks to activate a token the account must activate first", () => {
    const gate = { type: "activation", method: "trustline" } as const;
    expect(resolveReceiveBlock({ ...settled, gate }).blockedReason).toBe("assetActivationRequired");
  });

  it("waits for the token status read again after its activation flow", () => {
    const gate = { type: "activation", method: "optIn" } as const;
    expect(
      resolveReceiveBlock({
        ...settled,
        gate,
        hasReturnedFromActivation: true,
        isAssetStatusPending: true,
      }),
    ).toEqual({ isLoadingAddress: true });
  });

  it("tells the activation is pending while the network does not report the token yet", () => {
    const gate = { type: "activation", method: "association" } as const;
    expect(
      resolveReceiveBlock({ ...settled, gate, hasReturnedFromActivation: true }).blockedReason,
    ).toBe("assetActivationPending");
  });

  it("hands over to the legacy flow a token whose activation cannot be told", () => {
    expect(resolveReceiveBlock({ ...settled, gate: { type: "unknown" } }).blockedReason).toBe(
      "assetActivationUnknown",
    );
  });

  it("hides a sanctioned address", () => {
    expect(resolveReceiveBlock({ ...settled, isSanctioned: true }).blockedReason).toBe(
      "sanctioned",
    );
  });
});
