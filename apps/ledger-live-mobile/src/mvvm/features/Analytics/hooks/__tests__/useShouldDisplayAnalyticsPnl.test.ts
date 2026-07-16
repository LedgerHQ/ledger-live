import { renderHook } from "@testing-library/react-native";
import * as useWalletFeaturesConfigModule from "@features/platform-feature-flags";
import type { WalletFeaturesConfig } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { useShouldDisplayAnalyticsPnl } from "../useShouldDisplayAnalyticsPnl";

jest.mock("@features/platform-feature-flags");
jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(),
}));

const mockUseWalletFeaturesConfig = jest.mocked(
  useWalletFeaturesConfigModule.useWalletFeaturesConfig,
);
const mockUseSelector = jest.mocked(useSelector);

const mockAccount = { id: "acc-1" };

function mockWalletConfig(shouldDisplayPnl: boolean) {
  mockUseWalletFeaturesConfig.mockReturnValue({
    shouldDisplayPnl,
  } as WalletFeaturesConfig);
}

describe("useShouldDisplayAnalyticsPnl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletConfig(true);
    mockUseSelector.mockReturnValue([mockAccount]);
  });

  it("returns true when the pnl flag is on and accounts exist", () => {
    const { result } = renderHook(() => useShouldDisplayAnalyticsPnl());

    expect(result.current).toBe(true);
    expect(mockUseWalletFeaturesConfig).toHaveBeenCalledWith("mobile");
  });

  it("returns false when the pnl flag is off", () => {
    mockWalletConfig(false);

    const { result } = renderHook(() => useShouldDisplayAnalyticsPnl());

    expect(result.current).toBe(false);
  });

  it("returns false when there are no accounts", () => {
    mockUseSelector.mockReturnValue([]);

    const { result } = renderHook(() => useShouldDisplayAnalyticsPnl());

    expect(result.current).toBe(false);
  });
});
