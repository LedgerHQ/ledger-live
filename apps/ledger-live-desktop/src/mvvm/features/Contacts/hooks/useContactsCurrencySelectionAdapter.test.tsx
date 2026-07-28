import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useOpenCurrencyFlow } from "../../ModularDialog/hooks/useOpenCurrencyFlow";
import { useContactsCurrencySelectionAdapter } from "./useContactsCurrencySelectionAdapter";

jest.mock("../../ModularDialog/hooks/useOpenCurrencyFlow", () => ({
  useOpenCurrencyFlow: jest.fn(),
}));

const openCurrencyFlow = jest.fn();

describe("useContactsCurrencySelectionAdapter", () => {
  const ethereumId = getCryptoCurrencyById("ethereum").id;
  const bitcoinId = getCryptoCurrencyById("bitcoin").id;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useOpenCurrencyFlow).mockReturnValue({ openCurrencyFlow });
  });

  it("should pass the exact network ids and return the selected currency id", async () => {
    openCurrencyFlow.mockResolvedValue(getCryptoCurrencyById("ethereum"));
    const { result } = renderHook(() => useContactsCurrencySelectionAdapter());

    await expect(result.current.selectCurrency([ethereumId, bitcoinId])).resolves.toBe(ethereumId);
    expect(openCurrencyFlow).toHaveBeenCalledWith([ethereumId, bitcoinId]);
  });

  it("should return null when the selected currency id is invalid", async () => {
    openCurrencyFlow.mockResolvedValue({ id: "" } as CryptoOrTokenCurrency);
    const { result } = renderHook(() => useContactsCurrencySelectionAdapter());

    await expect(result.current.selectCurrency([ethereumId])).resolves.toBeNull();
  });

  it("should return null when the selection is cancelled", async () => {
    openCurrencyFlow.mockResolvedValue(null);
    const { result } = renderHook(() => useContactsCurrencySelectionAdapter());

    await expect(result.current.selectCurrency([ethereumId])).resolves.toBeNull();
  });
});
