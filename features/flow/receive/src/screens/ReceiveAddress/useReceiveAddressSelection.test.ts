import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { track } from "@shared/analytics";
import { useReceiveAddressSelection } from "./useReceiveAddressSelection";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const Z_ADDR = "u1shieldedaddressexample0000000000000000000000000000";

describe("useReceiveAddressSelection", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("should show the only address right away", () => {
    const receive = mockAccountReceive();
    const { result } = renderHook(() => useReceiveAddressSelection(receive));

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.selected?.address).toBe(receive.address);
    expect(result.current.backToSelection).toBeUndefined();
  });

  it("should select nothing before the receive is read", () => {
    const { result } = renderHook(() => useReceiveAddressSelection(undefined));

    expect(result.current).toEqual(
      expect.objectContaining({ options: [], selected: undefined, isSelecting: false }),
    );
  });

  it("should let the user pick the shielded address of a Zcash account, then go back", () => {
    const receive = mockAccountReceive({ shielded: { address: Z_ADDR } });
    const { result } = renderHook(() => useReceiveAddressSelection(receive));

    expect(result.current.isSelecting).toBe(true);
    expect(result.current.selected).toBeUndefined();

    act(() => result.current.select("shielded"));
    expect(result.current.selected?.address).toBe(Z_ADDR);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "private address", flow: "receive" }),
    );

    act(() => result.current.backToSelection?.());
    expect(result.current.isSelecting).toBe(true);
  });

  it("should track the public address choice", () => {
    const receive = mockAccountReceive({ shielded: { address: Z_ADDR } });
    const { result } = renderHook(() => useReceiveAddressSelection(receive));

    act(() => result.current.select("transparent"));

    expect(result.current.selected?.address).toBe(receive.address);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "public address" }),
    );
  });
});
