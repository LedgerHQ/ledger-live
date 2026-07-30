import { Linking } from "react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import useAddressTypeTooltipViewModel from "./useAddressTypeTooltipViewModel";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

describe("useAddressTypeTooltipViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("toggles isOpen through onOpen / onClose and tracks the open event", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({ accountSchemes: ["native_segwit"], currency: bitcoin }),
    );

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.onOpen());
    expect(result.current.isOpen).toBe(true);
    expect(track).toHaveBeenCalledWith("AddAccountsAddressTypeTooltip");

    act(() => result.current.onClose());
    expect(result.current.isOpen).toBe(false);
  });

  it("opens the bitcoin address type url and tracks on learn more", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);

    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({ accountSchemes: [], currency: bitcoin }),
    );

    act(() => result.current.onClickLearnMore());

    expect(track).toHaveBeenCalledWith("AddAccountsSupportLink_AddressType");
    expect(openURL).toHaveBeenCalledWith(urls.bitcoinAddressType);
  });

  it("only displays the learn more button for the bitcoin family", () => {
    const { result: btc } = renderHook(() =>
      useAddressTypeTooltipViewModel({ accountSchemes: [], currency: bitcoin }),
    );
    expect(btc.current.displayLearnMoreButton).toBe(true);

    const { result: eth } = renderHook(() =>
      useAddressTypeTooltipViewModel({ accountSchemes: [], currency: ethereum }),
    );
    expect(eth.current.displayLearnMoreButton).toBe(false);
  });

  it("maps the empty derivation mode to 'legacy' and leaves others untouched", () => {
    const { result } = renderHook(() =>
      useAddressTypeTooltipViewModel({
        accountSchemes: ["", "native_segwit", "taproot"],
        currency: bitcoin,
      }),
    );

    expect(result.current.formattedAccountSchemes).toEqual(["legacy", "native_segwit", "taproot"]);
  });

  it("returns an empty schemes array when accountSchemes is null or undefined", () => {
    const { result: nullResult } = renderHook(() =>
      useAddressTypeTooltipViewModel({ accountSchemes: null, currency: bitcoin }),
    );
    expect(nullResult.current.formattedAccountSchemes).toEqual([]);

    const { result: undefinedResult } = renderHook(() =>
      useAddressTypeTooltipViewModel({ accountSchemes: undefined, currency: bitcoin }),
    );
    expect(undefinedResult.current.formattedAccountSchemes).toEqual([]);
  });
});
