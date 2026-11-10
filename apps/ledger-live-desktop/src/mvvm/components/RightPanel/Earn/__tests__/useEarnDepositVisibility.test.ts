import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useEarnDepositVisibility } from "../useEarnDepositVisibility";

const run = (flag?: object) =>
  renderHook(() => useEarnDepositVisibility(), {
    initialState: flag ? withFlagOverrides({ ptxEarnLiveApp: flag }) : undefined,
  }).result.current;

describe("useEarnDepositVisibility", () => {
  it("is off by default", () => {
    expect(run()).toBe(false);
  });

  it("is off when the param is absent", () => {
    expect(run({ enabled: true, params: { manifest_id: "earn" } })).toBe(false);
  });

  it("is off when the earn flag is disabled", () => {
    expect(
      run({ enabled: false, params: { manifest_id: "earn", homeDepositWidget: true } }),
    ).toBe(false);
  });

  it("is on when the param is true", () => {
    expect(run({ enabled: true, params: { manifest_id: "earn", homeDepositWidget: true } })).toBe(
      true,
    );
  });
});
