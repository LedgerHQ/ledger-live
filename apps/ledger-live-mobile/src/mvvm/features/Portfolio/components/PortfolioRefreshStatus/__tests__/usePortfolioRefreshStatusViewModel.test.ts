import { renderHook } from "@tests/test-renderer";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import * as useWalletFeaturesConfigModule from "@ledgerhq/live-common/featureFlags/index";
import type { WalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/types";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import { usePortfolioRefreshStatusViewModel } from "../usePortfolioRefreshStatusViewModel";

jest.mock("LLM/hooks/usePortfolioBalance");
jest.mock("@ledgerhq/live-common/featureFlags/index");

const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);
const mockUseWalletFeaturesConfig = jest.mocked(
  useWalletFeaturesConfigModule.useWalletFeaturesConfig,
);

function mockSync(syncPhase: SyncPhase, isManualRefreshLoading = false) {
  mockUsePortfolioBalance.mockReturnValue({ syncPhase, isManualRefreshLoading } as ReturnType<
    typeof mockUsePortfolioBalance
  >);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWalletFeaturesConfig.mockReturnValue({
    shouldDisplayBalanceRefreshRework: true,
  } as WalletFeaturesConfig);
});

it("banner stays visible through the settle-guard window then clears on synced", () => {
  mockSync("syncing", true);
  const { result, rerender } = renderHook(() => usePortfolioRefreshStatusViewModel());
  expect(result.current.isRefreshing).toBe(true);

  // accounts done but syncPhase still "syncing" (settle-guard) → banner must stay
  mockSync("syncing", false);
  rerender({});
  expect(result.current.isRefreshing).toBe(true);

  mockSync("synced");
  rerender({});
  expect(result.current.isRefreshing).toBe(false);
});

it("never shows banner during cold start (syncPhase syncing but no user trigger)", () => {
  mockSync("syncing", false);
  const { result, rerender } = renderHook(() => usePortfolioRefreshStatusViewModel());
  expect(result.current.isRefreshing).toBe(false);
  expect(result.current.isVisible).toBe(false);

  mockSync("synced");
  rerender({});
  expect(result.current.isRefreshing).toBe(false);
  expect(result.current.isVisible).toBe(false);
});

it("outcome becomes error when syncPhase is failed after user refresh", () => {
  mockSync("syncing", true);
  const { result, rerender } = renderHook(() => usePortfolioRefreshStatusViewModel());
  expect(result.current.isRefreshing).toBe(true);

  mockSync("failed", false);
  rerender({});
  expect(result.current.isRefreshing).toBe(false);
  expect(result.current.outcome).toBe("error");
});
