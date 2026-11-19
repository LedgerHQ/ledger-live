import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockAccountStatus, mockAssetStatus } from "@domain/entity-account-status/schema.mock";
import { toReceiveScreenState, type ReceiveKindRead } from "../toReceiveScreenState";

const loaded = <T>(data: T): ReceiveKindRead<T> => ({ data, failed: false });
const pending: ReceiveKindRead<never> = { data: undefined, failed: false };
const failed: ReceiveKindRead<never> = { data: undefined, failed: true };

const receive = mockAccountReceive();
const used = mockAccountStatus();
const onboarding = mockAccountStatus({ used: false, gate: { type: "onboarding" } });
const optIn = mockAssetStatus({ gate: { type: "activation", method: "optIn" } });

describe("toReceiveScreenState", () => {
  it("should be ready once the native coin's receive and account status are read", () => {
    expect(toReceiveScreenState({ receive: loaded(receive), accountStatus: loaded(used) })).toEqual(
      { type: "ready", receive },
    );
  });

  it("should load while a kind has no answer yet", () => {
    expect(toReceiveScreenState({ receive: pending, accountStatus: loaded(used) })).toEqual({
      type: "loading",
    });
    expect(toReceiveScreenState({ receive: loaded(receive), accountStatus: pending })).toEqual({
      type: "loading",
    });
  });

  it("should wait for a token's asset status before telling it has no gate", () => {
    expect(
      toReceiveScreenState({
        receive: loaded(receive),
        accountStatus: loaded(used),
        assetStatus: pending,
      }),
    ).toEqual({ type: "loading" });
  });

  it("should be ready for a token without gate", () => {
    expect(
      toReceiveScreenState({
        receive: loaded(receive),
        accountStatus: loaded(used),
        assetStatus: loaded(mockAssetStatus()),
      }),
    ).toEqual({ type: "ready", receive });
  });

  it("should ask to onboard the account, even when its receive read failed", () => {
    expect(toReceiveScreenState({ receive: failed, accountStatus: loaded(onboarding) })).toEqual({
      type: "onboardingRequired",
    });
  });

  it("should ask to activate the token with the method of its gate", () => {
    expect(
      toReceiveScreenState({
        receive: loaded(receive),
        accountStatus: loaded(used),
        assetStatus: loaded(optIn),
      }),
    ).toEqual({ type: "activationRequired", method: "optIn" });
  });

  it.each([
    ["receive", { receive: failed, accountStatus: loaded(used) }],
    ["accountStatus", { receive: loaded(receive), accountStatus: failed }],
    ["assetStatus", { receive: loaded(receive), accountStatus: loaded(used), assetStatus: failed }],
  ])("fails when the %s read failed with nothing stored", (_kind, reads) => {
    expect(toReceiveScreenState(reads)).toEqual({ type: "error" });
  });
});
