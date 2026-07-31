import { renderHook } from "@tests/test-renderer";
import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useContactsAddressCurrencyAdapter } from "./useContactsAddressCurrencyAdapter";

describe("useContactsAddressCurrencyAdapter", () => {
  it("returns the native currency id for known crypto currencies", () => {
    const { result } = renderHook(() => useContactsAddressCurrencyAdapter());

    expect(result.current.resolveNetworkId(getCryptoCurrencyById("ethereum").id)).toBe("ethereum");
  });

  it("resolves token parent networks for grouping", () => {
    const { result } = renderHook(() => useContactsAddressCurrencyAdapter());

    expect(
      result.current.resolveNetworkId(
        mockContactAddress({ currencyId: "ethereum/erc20/usd-coin" }).currencyId,
      ),
    ).toBe("ethereum");
  });

  it("returns undefined for unknown currency ids", () => {
    const { result } = renderHook(() => useContactsAddressCurrencyAdapter());

    expect(
      result.current.resolveNetworkId(
        mockContactAddress({ currencyId: "unknown-currency-id" }).currencyId,
      ),
    ).toBeUndefined();
  });
});
