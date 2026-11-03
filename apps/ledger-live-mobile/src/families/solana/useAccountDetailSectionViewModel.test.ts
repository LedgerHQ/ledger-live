import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { renderHook } from "@tests/test-renderer";
import { useAccountDetailSectionViewModel } from "./useAccountDetailSectionViewModel";

const isAccountEmpty = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridgeOrNull: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

const { useAccountBridgeOrNull } = jest.requireMock(
  "@ledgerhq/live-common/bridge/useAccountBridge",
);
const { getCurrencyConfiguration } = jest.requireMock("@ledgerhq/live-common/config/index");

const mainAccount = { type: "Account", currency: { id: "solana" } } as SolanaAccount;
const tokenAccount = {
  type: "TokenAccount",
  currency: { id: "solana-usdc" },
} as unknown as TokenAccount;

describe("useAccountDetailSectionViewModel", () => {
  beforeEach(() => {
    isAccountEmpty.mockReset().mockReturnValue(false);
    useAccountBridgeOrNull.mockReturnValue({ isAccountEmpty });
    getCurrencyConfiguration.mockReturnValue({});
  });

  it("shows the balance summary and the delegations of a used account", () => {
    const { result } = renderHook(() => useAccountDetailSectionViewModel(mainAccount));

    expect(useAccountBridgeOrNull).toHaveBeenCalledWith(mainAccount, null);
    expect(result.current.showBalanceSummary).toBe(true);
    expect(result.current.showDelegations).toBe(true);
  });

  it("hides both staking blocks when the account is empty", () => {
    isAccountEmpty.mockReturnValue(true);

    const { result } = renderHook(() => useAccountDetailSectionViewModel(mainAccount));

    expect(result.current.showBalanceSummary).toBe(false);
    expect(result.current.showDelegations).toBe(false);
  });

  it("hides both staking blocks when the account bridge is missing", () => {
    useAccountBridgeOrNull.mockReturnValue(null);

    const { result } = renderHook(() => useAccountDetailSectionViewModel(mainAccount));

    expect(result.current.showBalanceSummary).toBe(false);
    expect(result.current.showDelegations).toBe(false);
  });

  it("keeps the delegations and hides the balance summary when delegation is disabled", () => {
    getCurrencyConfiguration.mockReturnValue({ disableDelegation: true });

    const { result } = renderHook(() => useAccountDetailSectionViewModel(mainAccount));

    expect(result.current.showBalanceSummary).toBe(false);
    expect(result.current.showDelegations).toBe(true);
  });

  it("hides both staking blocks for a token account without asking the bridge", () => {
    const parentAccount = { type: "Account", id: "parent" } as SolanaAccount;
    const { result } = renderHook(() =>
      useAccountDetailSectionViewModel(tokenAccount, parentAccount),
    );

    expect(useAccountBridgeOrNull).toHaveBeenCalledWith(null, parentAccount);
    expect(result.current.showBalanceSummary).toBe(false);
    expect(result.current.showDelegations).toBe(false);
  });
});
