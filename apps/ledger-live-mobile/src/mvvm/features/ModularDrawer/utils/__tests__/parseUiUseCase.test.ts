import { parseUiUseCase } from "../parseUiUseCase";

describe("parseUiUseCase", () => {
  it("should detect perps without variant", () => {
    expect(parseUiUseCase("perpetuals")).toEqual({
      namespace: "perpetuals",
      variant: undefined,
      isPerpsWithoutVariant: true,
      isPerpsDeposit: false,
    });
  });

  it("should detect the perps deposit variant", () => {
    expect(parseUiUseCase("perpetuals:deposit")).toEqual({
      namespace: "perpetuals",
      variant: "deposit",
      isPerpsWithoutVariant: false,
      isPerpsDeposit: true,
    });
  });

  it("should not treat another perps variant as a deposit", () => {
    expect(parseUiUseCase("perpetuals:withdraw")).toEqual({
      namespace: "perpetuals",
      variant: "withdraw",
      isPerpsWithoutVariant: false,
      isPerpsDeposit: false,
    });
  });

  it("should not treat another namespace as perps", () => {
    expect(parseUiUseCase("swap:deposit")).toEqual({
      namespace: "swap",
      variant: "deposit",
      isPerpsWithoutVariant: false,
      isPerpsDeposit: false,
    });
  });

  it("should handle undefined uiUseCase", () => {
    expect(parseUiUseCase(undefined)).toEqual({
      namespace: undefined,
      variant: undefined,
      isPerpsWithoutVariant: false,
      isPerpsDeposit: false,
    });
  });
});
