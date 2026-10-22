import { renderHook } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { useAccountDetailFeature } from "./useAccountDetailFeature";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

describe("useAccountDetailFeature", () => {
  beforeEach(() => {
    mockUseFeature.mockReturnValue({
      enabled: true,
      params: { excludedCurrencyIds: ["solana"] },
    });
  });

  it("reads the accountDetail flag", () => {
    renderHook(() => useAccountDetailFeature("bitcoin"));

    expect(mockUseFeature).toHaveBeenCalledWith("accountDetail");
  });

  it("is enabled for a currency that is not excluded", () => {
    const { result } = renderHook(() => useAccountDetailFeature("bitcoin"));

    expect(result.current).toBe(true);
  });

  it("is disabled for an excluded currency", () => {
    const { result } = renderHook(() => useAccountDetailFeature("solana"));

    expect(result.current).toBe(false);
  });

  it("is disabled while the account currency is unknown", () => {
    const { result } = renderHook(() => useAccountDetailFeature(undefined));

    expect(result.current).toBe(false);
  });
});
