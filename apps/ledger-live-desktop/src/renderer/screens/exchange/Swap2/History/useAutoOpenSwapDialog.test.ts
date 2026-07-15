import { renderHook } from "tests/testSetup";
import type {
  MappedSwapOperation,
  SwapHistorySection,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useAutoOpenSwapDialog } from "./useAutoOpenSwapDialog";
import {
  closeSwapTransactionStatusDialog,
  selectIsSwapTransactionStatusDialogOpen,
  selectSwapTransactionStatusDialogParams,
} from "LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog";

const makeOperation = (swapId: string): MappedSwapOperation =>
  ({ swapId, provider: "changelly" }) as unknown as MappedSwapOperation;

const makeSections = (swapIds: string[]): SwapHistorySection[] =>
  swapIds.length
    ? [{ day: new Date(), data: swapIds.map(makeOperation) } as SwapHistorySection]
    : [];

type Props = { swapId: string | undefined; sections: SwapHistorySection[] | undefined | null };

const renderAutoOpen = (swapId: string | undefined, sections: Props["sections"]) =>
  renderHook(({ swapId, sections }: Props) => useAutoOpenSwapDialog(swapId, sections), {
    initialProps: { swapId, sections },
  });

describe("useAutoOpenSwapDialog", () => {
  it("opens the dialog for the operation matching the swapId", () => {
    const { store } = renderAutoOpen("swap-1", makeSections(["swap-0", "swap-1"]));

    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(true);
    expect(selectSwapTransactionStatusDialogParams(store.getState())).toEqual({
      swapId: "swap-1",
      provider: "changelly",
    });
  });

  it("does nothing when no swapId is passed", () => {
    const { store } = renderAutoOpen(undefined, makeSections(["swap-1"]));

    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(false);
  });

  it("does nothing when the history has not loaded yet", () => {
    const { store } = renderAutoOpen("swap-1", null);

    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(false);
  });

  it("does nothing when no operation matches the swapId", () => {
    const { store } = renderAutoOpen("missing", makeSections(["swap-1"]));

    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(false);
  });

  it("retries on later syncs until the swap operation appears", () => {
    const { store, rerender } = renderAutoOpen("swap-1", null);
    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(false);

    rerender({ swapId: "swap-1", sections: makeSections(["swap-1"]) });

    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(true);
    expect(selectSwapTransactionStatusDialogParams(store.getState())).toEqual({
      swapId: "swap-1",
      provider: "changelly",
    });
  });

  it("re-opens when a different swapId is passed to an already-mounted screen", () => {
    const sections = makeSections(["swap-1", "swap-2"]);
    const { store, rerender } = renderAutoOpen("swap-1", sections);
    expect(selectSwapTransactionStatusDialogParams(store.getState())).toEqual({
      swapId: "swap-1",
      provider: "changelly",
    });

    rerender({ swapId: "swap-2", sections });

    expect(selectSwapTransactionStatusDialogParams(store.getState())).toEqual({
      swapId: "swap-2",
      provider: "changelly",
    });
  });

  it("does not re-open for the same swapId once it has already been opened", () => {
    const sections = makeSections(["swap-1"]);
    const { store, rerender } = renderAutoOpen("swap-1", sections);
    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(true);

    store.dispatch(closeSwapTransactionStatusDialog());
    rerender({ swapId: "swap-1", sections });

    expect(selectIsSwapTransactionStatusDialogOpen(store.getState())).toBe(false);
  });
});
