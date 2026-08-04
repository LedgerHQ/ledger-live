import { parseUiUseCase } from "../parseUiUseCase";

describe("parseUiUseCase", () => {
  it("should detect perps without variant", () => {
    expect(parseUiUseCase("perpetuals")).toEqual({
      namespace: "perpetuals",
      variant: undefined,
      isPerpsWithoutVariant: true,
      hasVariant: false,
    });
  });

  it("should detect perps with variant", () => {
    expect(parseUiUseCase("perpetuals:deposit")).toEqual({
      namespace: "perpetuals",
      variant: "deposit",
      isPerpsWithoutVariant: false,
      hasVariant: true,
    });
  });

  it("should handle undefined uiUseCase", () => {
    expect(parseUiUseCase(undefined)).toEqual({
      namespace: undefined,
      variant: undefined,
      isPerpsWithoutVariant: false,
      hasVariant: false,
    });
  });
});
