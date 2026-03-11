import { renderHook, act } from "@tests/test-renderer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Linking } from "react-native";
import useAddressTypeTooltipViewModel from "../useAddressTypeTooltipViewModel";

jest.mock("~/analytics", () => ({ track: jest.fn() }));

jest.mock("~/utils/urls", () => ({
  urls: { bitcoinAddressType: "https://ledger.com/bitcoin-address-type" },
}));

const makeCurrency = (family: string) => ({ family }) as CryptoCurrency;

describe("useAddressTypeTooltipViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should format empty string derivation mode to 'legacy'", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: ["", "native_segwit"],
        currency: makeCurrency("bitcoin"),
      }),
    );

    expect(result.current.formattedAccountSchemes).toEqual(["legacy", "native_segwit"]);
  });

  it("should keep non-empty derivation modes as-is", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: ["segwit", "native_segwit", "taproot"],
        currency: makeCurrency("bitcoin"),
      }),
    );

    expect(result.current.formattedAccountSchemes).toEqual(["segwit", "native_segwit", "taproot"]);
  });

  it("should return empty array when accountSchemes is null", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: null,
        currency: makeCurrency("bitcoin"),
      }),
    );

    expect(result.current.formattedAccountSchemes).toEqual([]);
  });

  it("should display learn more button for bitcoin family", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: [],
        currency: makeCurrency("bitcoin"),
      }),
    );

    expect(result.current.displayLearnMoreButton).toBe(true);
  });

  it("should not display learn more button for non-bitcoin families", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: [],
        currency: makeCurrency("ethereum"),
      }),
    );

    expect(result.current.displayLearnMoreButton).toBe(false);
  });

  it("should toggle isOpen on onOpen/onClose", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: [],
        currency: makeCurrency("bitcoin"),
      }),
    );

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.onOpen());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.onClose());
    expect(result.current.isOpen).toBe(false);
  });

  it("should call Linking.openURL with bitcoin address type URL on onClickLearnMore", () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockImplementation(jest.fn());

    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: [],
        currency: makeCurrency("bitcoin"),
      }),
    );

    act(() => result.current.onClickLearnMore());

    expect(openURLSpy).toHaveBeenCalledWith("https://ledger.com/bitcoin-address-type");

    openURLSpy.mockRestore();
  });
});
