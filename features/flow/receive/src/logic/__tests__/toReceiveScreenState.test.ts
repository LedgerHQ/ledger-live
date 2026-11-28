import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockAccountStatus, mockAssetStatus } from "@domain/entity-account-status/schema.mock";
import { toReceiveScreenState, type ReceiveKindRead } from "../toReceiveScreenState";

const loaded = <T>(data: T): ReceiveKindRead<T> => ({ data, failed: false });
const pending: ReceiveKindRead<never> = { data: undefined, failed: false };
const failed: ReceiveKindRead<never> = { data: undefined, failed: true };

const receive = mockAccountReceive();
const used = mockAccountStatus();
const onboarding = mockAccountStatus({ used: false, gate: { type: "onboarding" } });
const toActivate = mockAssetStatus({ gate: { type: "activation" } });
const noGate = loaded(mockAssetStatus());

describe("toReceiveScreenState", () => {
  it("should be ready once every kind is read and the asset has no gate", () => {
    expect(
      toReceiveScreenState({
        receive: loaded(receive),
        accountStatus: loaded(used),
        assetStatus: noGate,
      }),
    ).toEqual({ type: "ready", receive });
  });

  it.each([
    ["receive", { receive: pending, accountStatus: loaded(used), assetStatus: noGate }],
    ["accountStatus", { receive: loaded(receive), accountStatus: pending, assetStatus: noGate }],
    [
      "assetStatus",
      { receive: loaded(receive), accountStatus: loaded(used), assetStatus: pending },
    ],
  ])("should load while %s has no answer yet", (_kind, reads) => {
    expect(toReceiveScreenState(reads)).toEqual({ type: "loading" });
  });

  it("should ask to onboard the account, even when its receive read failed", () => {
    expect(
      toReceiveScreenState({
        receive: failed,
        accountStatus: loaded(onboarding),
        assetStatus: noGate,
      }),
    ).toEqual({ type: "onboardingRequired" });
  });

  it("should ask to activate the token behind an activation gate", () => {
    expect(
      toReceiveScreenState({
        receive: loaded(receive),
        accountStatus: loaded(used),
        assetStatus: loaded(toActivate),
      }),
    ).toEqual({ type: "activationRequired" });
  });

  it.each([
    ["receive", { receive: failed, accountStatus: loaded(used), assetStatus: noGate }],
    ["accountStatus", { receive: loaded(receive), accountStatus: failed, assetStatus: noGate }],
    ["assetStatus", { receive: loaded(receive), accountStatus: loaded(used), assetStatus: failed }],
  ])("fails when the %s read failed with nothing stored", (_kind, reads) => {
    expect(toReceiveScreenState(reads)).toEqual({ type: "error" });
  });
});
