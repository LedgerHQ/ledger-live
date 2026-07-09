import { renderHook } from "@tests/test-renderer";
import type {
  MappedSwapOperation,
  SwapHistorySection,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useAutoOpenSwapDrawer } from "../useAutoOpenSwapDrawer";
import { closeSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";

const makeOperation = (swapId: string): MappedSwapOperation =>
  ({ swapId, provider: "changelly" }) as unknown as MappedSwapOperation;

const makeSections = (swapIds: string[]): SwapHistorySection[] =>
  swapIds.length
    ? [{ day: new Date(), data: swapIds.map(makeOperation) } as SwapHistorySection]
    : [];

describe("useAutoOpenSwapDrawer", () => {
  let swapId: string | undefined;
  let sections: SwapHistorySection[];

  const render = () => renderHook(() => useAutoOpenSwapDrawer(swapId, sections));

  beforeEach(() => {
    swapId = undefined;
    sections = [];
  });

  it("opens the drawer for the operation matching the swapId", () => {
    swapId = "swap-1";
    sections = makeSections(["swap-0", "swap-1"]);

    const { store } = render();

    expect(store.getState().swapTransactionStatusDrawer).toEqual({
      isOpen: true,
      params: { swapId: "swap-1", provider: "changelly" },
    });
  });

  it("does nothing when no swapId is passed", () => {
    sections = makeSections(["swap-1"]);

    const { store } = render();

    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);
  });

  it("does nothing when the history is still empty", () => {
    swapId = "swap-1";

    const { store } = render();

    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);
  });

  it("does nothing when no operation matches the swapId", () => {
    swapId = "missing";
    sections = makeSections(["swap-1"]);

    const { store } = render();

    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);
  });

  it("retries on later syncs until the swap operation appears", () => {
    swapId = "swap-1";
    sections = [];

    const { store, rerender } = render();
    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);

    sections = makeSections(["swap-1"]);
    rerender({});

    expect(store.getState().swapTransactionStatusDrawer).toEqual({
      isOpen: true,
      params: { swapId: "swap-1", provider: "changelly" },
    });
  });

  it("re-opens when a different swapId is passed to an already-mounted screen", () => {
    sections = makeSections(["swap-1", "swap-2"]);
    swapId = "swap-1";

    const { store, rerender } = render();
    expect(store.getState().swapTransactionStatusDrawer.params).toEqual({
      swapId: "swap-1",
      provider: "changelly",
    });

    swapId = "swap-2";
    rerender({});

    expect(store.getState().swapTransactionStatusDrawer.params).toEqual({
      swapId: "swap-2",
      provider: "changelly",
    });
  });

  it("does not re-open for the same swapId once it has already been opened", () => {
    sections = makeSections(["swap-1"]);
    swapId = "swap-1";

    const { store, rerender } = render();
    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(true);

    store.dispatch(closeSwapTransactionStatusDrawer());
    rerender({});

    expect(store.getState().swapTransactionStatusDrawer.isOpen).toBe(false);
  });
});
