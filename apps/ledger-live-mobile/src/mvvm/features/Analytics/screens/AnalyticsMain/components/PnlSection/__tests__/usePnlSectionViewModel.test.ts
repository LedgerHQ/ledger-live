import { act } from "react";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import * as walletPnlHooks from "@ledgerhq/wallet-pnl/hooks";
import { State } from "~/reducers/types";
import { usePnlSectionViewModel } from "../usePnlSectionViewModel";

const withPnl = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

const withDiscreet =
  (discreetMode: boolean) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, discreetMode },
  });

const compose =
  (...transforms: Array<(state: State) => State>) =>
  (state: State): State =>
    transforms.reduce((acc, t) => t(acc), state);

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

  describe("discreet mode", () => {
    it("masks card values when discreet mode is on", () => {
      const { result } = renderHook(() => usePnlSectionViewModel(), {
        overrideInitialState: compose(withPnl(true), withDiscreet(true)),
      });

      expect(result.current.unrealised.value).toContain("***");
      expect(result.current.costBasis.value).toContain("***");
    });

    it("masks every drawer item value when discreet mode is on", () => {
      const { result } = renderHook(() => usePnlSectionViewModel(), {
        overrideInitialState: compose(withPnl(true), withDiscreet(true)),
      });

      for (const item of result.current.pnlDrawer.items) {
        expect(item.value).toContain("***");
      }
    });

    it("does not mask values when discreet mode is off", () => {
      const { result } = renderHook(() => usePnlSectionViewModel(), {
        overrideInitialState: compose(withPnl(true), withDiscreet(false)),
      });

      expect(result.current.unrealised.value).not.toContain("***");
      expect(result.current.costBasis.value).not.toContain("***");
      for (const item of result.current.pnlDrawer.items) {
        expect(item.value).not.toContain("***");
      }
    });
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
