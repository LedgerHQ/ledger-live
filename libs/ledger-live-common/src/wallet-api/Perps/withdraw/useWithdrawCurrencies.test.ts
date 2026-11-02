/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook, waitFor } from "@testing-library/react";
import { useWithdrawCurrencies } from "./useWithdrawCurrencies";

const mockFetchWithdrawCurrencies = jest.fn();
jest.mock("./currencies", () => ({
  fetchPerpsWithdrawCurrencies: () => mockFetchWithdrawCurrencies(),
}));

describe("useWithdrawCurrencies", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the Ledger Wallet ids of the assets a withdrawal can land in", async () => {
    mockFetchWithdrawCurrencies.mockResolvedValue(["ethereum", "bitcoin"]);

    const { result } = renderHook(() => useWithdrawCurrencies());

    expect(result.current).toEqual({ currencyIds: undefined, isError: false });
    await waitFor(() => expect(result.current.currencyIds).toEqual(["ethereum", "bitcoin"]));
  });

  it("reports a failed request so no unsupported asset is offered", async () => {
    mockFetchWithdrawCurrencies.mockRejectedValue(new Error("down"));

    const { result } = renderHook(() => useWithdrawCurrencies());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.currencyIds).toBeUndefined();
  });
});
