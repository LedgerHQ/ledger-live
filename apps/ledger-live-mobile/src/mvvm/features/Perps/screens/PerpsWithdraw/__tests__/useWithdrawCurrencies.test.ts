import { renderHook, waitFor } from "@tests/test-renderer";
import { useWithdrawCurrencies } from "../useWithdrawCurrencies";

const mockFetchWithdrawCurrencies = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/api", () => ({
  fetchWithdrawCurrencies: () => mockFetchWithdrawCurrencies(),
}));

describe("useWithdrawCurrencies", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the Ledger Wallet ids of the assets a withdrawal can land in", async () => {
    mockFetchWithdrawCurrencies.mockResolvedValue({
      currencies: [{ id: "ethereum" }, { id: "bitcoin" }],
    });

    const { result } = renderHook(() => useWithdrawCurrencies());

    await waitFor(() => expect(result.current.currencyIds).toEqual(["ethereum", "bitcoin"]));
  });

  it("reports a failed request so no unsupported asset is offered", async () => {
    mockFetchWithdrawCurrencies.mockRejectedValue(new Error("down"));

    const { result } = renderHook(() => useWithdrawCurrencies());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.currencyIds).toBeUndefined();
  });
});
