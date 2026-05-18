import { act } from "react";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import * as walletPnlHooks from "@ledgerhq/wallet-pnl/hooks";
import { usePnlSectionViewModel } from "../usePnlSectionViewModel";

const withPnl = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

describe("usePnlSectionViewModel", () => {
  it("keeps both drawers closed by default", () => {
    const { result } = renderHook(() => usePnlSectionViewModel(), {
      overrideInitialState: withPnl(true),
    });

    expect(result.current.pnlDrawer.isOpen).toBe(false);
    expect(result.current.costBasisDrawer.isOpen).toBe(false);
  });

  it("opens the PnL drawer when the unrealised card press handler runs", () => {
    const { result } = renderHook(() => usePnlSectionViewModel(), {
      overrideInitialState: withPnl(true),
    });

    act(() => result.current.unrealised.onPress());

    expect(result.current.pnlDrawer.isOpen).toBe(true);
    expect(result.current.costBasisDrawer.isOpen).toBe(false);
  });

  it("opens the cost basis drawer when the cost basis card press handler runs", () => {
    const { result } = renderHook(() => usePnlSectionViewModel(), {
      overrideInitialState: withPnl(true),
    });

    act(() => result.current.costBasis.onPress());

    expect(result.current.pnlDrawer.isOpen).toBe(false);
    expect(result.current.costBasisDrawer.isOpen).toBe(true);
  });

  it("closes the open drawer when its onClose runs", () => {
    const { result } = renderHook(() => usePnlSectionViewModel(), {
      overrideInitialState: withPnl(true),
    });

    act(() => result.current.unrealised.onPress());
    expect(result.current.pnlDrawer.isOpen).toBe(true);

    act(() => result.current.pnlDrawer.onClose());
    expect(result.current.pnlDrawer.isOpen).toBe(false);

    act(() => result.current.costBasis.onPress());
    expect(result.current.costBasisDrawer.isOpen).toBe(true);

    act(() => result.current.costBasisDrawer.onClose());
    expect(result.current.costBasisDrawer.isOpen).toBe(false);
  });

  it("opening one drawer closes the other (single-drawer state machine)", () => {
    const { result } = renderHook(() => usePnlSectionViewModel(), {
      overrideInitialState: withPnl(true),
    });

    act(() => result.current.unrealised.onPress());
    expect(result.current.pnlDrawer.isOpen).toBe(true);

    act(() => result.current.costBasis.onPress());
    expect(result.current.pnlDrawer.isOpen).toBe(false);
    expect(result.current.costBasisDrawer.isOpen).toBe(true);
  });

  describe("usePortfolioPnL short-circuit", () => {
    let spy: jest.SpyInstance<
      ReturnType<typeof walletPnlHooks.usePortfolioPnL>,
      Parameters<typeof walletPnlHooks.usePortfolioPnL>
    >;

    beforeEach(() => {
      spy = jest.spyOn(walletPnlHooks, "usePortfolioPnL");
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("passes an empty accounts list to usePortfolioPnL when the flag is off", () => {
      renderHook(() => usePnlSectionViewModel(), {
        overrideInitialState: withPnl(false),
      });

      expect(spy).toHaveBeenCalledWith([], expect.anything(), expect.anything());
    });

    it("forwards the real accounts to usePortfolioPnL when the flag is on", () => {
      renderHook(() => usePnlSectionViewModel(), {
        overrideInitialState: withPnl(true),
      });

      const [accountsArg] = spy.mock.calls[0];
      expect(Array.isArray(accountsArg)).toBe(true);
    });
  });
});
