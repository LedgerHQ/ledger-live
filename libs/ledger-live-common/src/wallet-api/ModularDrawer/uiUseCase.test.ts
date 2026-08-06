import { getPerpsUiUseCase, PERPS_UI_USE_CASE } from "./uiUseCase";

describe("getPerpsUiUseCase", () => {
  it("keeps each variant it knows", () => {
    expect(getPerpsUiUseCase(PERPS_UI_USE_CASE.receive)).toBe(PERPS_UI_USE_CASE.receive);
    expect(getPerpsUiUseCase(PERPS_UI_USE_CASE.fund)).toBe(PERPS_UI_USE_CASE.fund);
    expect(getPerpsUiUseCase(PERPS_UI_USE_CASE.legacy)).toBe(PERPS_UI_USE_CASE.legacy);
  });

  it("falls back to the legacy pick for a variant it does not know", () => {
    expect(getPerpsUiUseCase("perpetuals:ships-later")).toBe(PERPS_UI_USE_CASE.legacy);
  });

  it("claims nothing for another namespace or for no use case at all", () => {
    expect(getPerpsUiUseCase("swap:fund")).toBeUndefined();
    expect(getPerpsUiUseCase(undefined)).toBeUndefined();
  });
});
