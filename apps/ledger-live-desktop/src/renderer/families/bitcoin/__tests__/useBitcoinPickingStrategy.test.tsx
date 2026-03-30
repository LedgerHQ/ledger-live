/**
 * @jest-environment jsdom
 */
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";
import { act, renderHook, waitFor } from "tests/testSetup";
import useBitcoinPickingStrategy from "../useBitcoinPickingStrategy";

type StrategyProps = { strategy: number };

describe("useBitcoinPickingStrategy", () => {
  const selectableStrategyKeySet = new Set(
    Object.keys(bitcoinPickingStrategy).filter(k => k !== "CUSTOM"),
  );

  it("exposes one select option per strategy except CUSTOM", () => {
    const { result } = renderHook(
      ({ strategy }: StrategyProps) => useBitcoinPickingStrategy(strategy),
      {
        initialProps: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS },
      },
    );

    expect(result.current.options).toHaveLength(selectableStrategyKeySet.size);
    for (const opt of result.current.options) {
      expect(selectableStrategyKeySet.has(opt.value)).toBe(true);
    }
  });

  it("does not list CUSTOM in options (effect at useBitcoinPickingStrategy skips syncing for CUSTOM)", () => {
    const { result } = renderHook(
      ({ strategy }: StrategyProps) => useBitcoinPickingStrategy(strategy),
      {
        initialProps: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS },
      },
    );

    expect(result.current.options.some(o => o.value === "CUSTOM")).toBe(false);
  });

  it("sets item to the option matching the initial strategy", () => {
    const { result } = renderHook(
      ({ strategy }: StrategyProps) => useBitcoinPickingStrategy(strategy),
      {
        initialProps: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE },
      },
    );

    expect(result.current.item?.value).toBe("OPTIMIZE_SIZE");
  });

  it("updates item when strategy changes between non-custom strategies", async () => {
    const { result, rerender } = renderHook(
      ({ strategy }: StrategyProps) => useBitcoinPickingStrategy(strategy),
      {
        initialProps: { strategy: bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST },
      },
    );

    expect(result.current.item?.value).toBe("DEEP_OUTPUTS_FIRST");

    rerender({ strategy: bitcoinPickingStrategy.MERGE_OUTPUTS });

    await waitFor(() => {
      expect(result.current.item?.value).toBe("MERGE_OUTPUTS");
    });
  });

  it("does not sync item when strategy becomes CUSTOM (keeps previous non-custom item)", async () => {
    const { result, rerender } = renderHook(
      ({ strategy }: StrategyProps) => useBitcoinPickingStrategy(strategy),
      {
        initialProps: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS },
      },
    );

    expect(result.current.item?.value).toBe("MERGE_OUTPUTS");

    rerender({ strategy: bitcoinPickingStrategy.CUSTOM });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.item?.value).toBe("MERGE_OUTPUTS");
  });
});
