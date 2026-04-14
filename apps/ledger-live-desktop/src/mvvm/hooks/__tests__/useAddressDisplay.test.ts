import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useAddressDisplay } from "../useAddressDisplay";

const ethCurrency = getCryptoCurrencyById("ethereum");
const ethAccount = genAccount("eth-addr-display", { currency: ethCurrency });

const stateWithAccount = { accounts: [ethAccount] };

describe("useAddressDisplay", () => {
  it("should return empty result for empty address", () => {
    const { result } = renderHook(() => useAddressDisplay("", "ethereum"), {
      initialState: stateWithAccount,
    });

    expect(result.current.displayName).toBe("");
    expect(result.current.matchingAccount).toBeUndefined();
  });

  it("should truncate address when no account match", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";

    const { result } = renderHook(() => useAddressDisplay(addr, "ethereum"), {
      initialState: stateWithAccount,
    });

    expect(result.current.displayName).toBe("0x1234...5678");
    expect(result.current.matchingAccount).toBeUndefined();
  });

  it("should match own account by freshAddress", () => {
    const { result } = renderHook(() => useAddressDisplay(ethAccount.freshAddress, "ethereum"), {
      initialState: stateWithAccount,
    });

    expect(result.current.matchingAccount).toBeDefined();
    expect(result.current.matchingAccount?.id).toBe(ethAccount.id);
  });

  it("should match freshAddress case-insensitively", () => {
    const { result } = renderHook(
      () => useAddressDisplay(ethAccount.freshAddress.toUpperCase(), "ethereum"),
      { initialState: stateWithAccount },
    );

    expect(result.current.matchingAccount?.id).toBe(ethAccount.id);
  });

  it("should not match account with different currencyId", () => {
    const { result } = renderHook(() => useAddressDisplay(ethAccount.freshAddress, "bitcoin"), {
      initialState: stateWithAccount,
    });

    expect(result.current.matchingAccount).toBeUndefined();
  });
});
