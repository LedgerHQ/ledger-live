import { renderHook, act } from "@tests/test-renderer";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import * as useWalletFeaturesConfigModule from "@features/platform-feature-flags";
import type { WalletFeaturesConfig } from "@features/platform-feature-flags";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import {
  usePortfolioRefreshStatusViewModel,
  REFRESH_STATUS_VISIBLE_DURATION_MS,
} from "../usePortfolioRefreshStatusViewModel";

jest.mock("LLM/hooks/usePortfolioBalance");
jest.mock("@features/platform-feature-flags");

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

it("outcome becomes success when syncPhase is synced after user refresh", () => {
  mockSync("syncing", true);
  const { result, rerender } = renderHook(() => usePortfolioRefreshStatusViewModel());

  mockSync("synced");
  rerender({});
  expect(result.current.outcome).toBe("success");
  expect(result.current.isVisible).toBe(true);
});

it("corrects outcome from success to error when syncPhase becomes failed during post-refresh window", () => {
  mockSync("syncing", true);
  const { result, rerender } = renderHook(() => usePortfolioRefreshStatusViewModel());

  mockSync("synced");
  rerender({});
  expect(result.current.outcome).toBe("success");

  mockSync("failed");
  rerender({});
  expect(result.current.outcome).toBe("error");
});

it("clears outcome to null after REFRESH_STATUS_VISIBLE_DURATION_MS elapses", () => {
  mockSync("syncing", true);
  const { result, rerender } = renderHook(() => usePortfolioRefreshStatusViewModel());

  mockSync("synced");
  rerender({});
  expect(result.current.outcome).toBe("success");

  act(() => {
    jest.advanceTimersByTime(REFRESH_STATUS_VISIBLE_DURATION_MS);
  });

  expect(result.current.outcome).toBeNull();
  expect(result.current.isVisible).toBe(false);
});
