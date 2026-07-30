import { act, renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useOpenCurrencyFlow } from "../useOpenCurrencyFlow";

describe("useOpenCurrencyFlow", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const bitcoin = getCryptoCurrencyById("bitcoin");

  it("should open the terminal currency flow with the exact network ids", () => {
    const { result, store } = renderHook(() => useOpenCurrencyFlow());

    void result.current.openCurrencyFlow([ethereum.id, bitcoin.id]);

    expect(store.getState().modularDialog.dialogParams).toMatchObject({
      networkIds: [ethereum.id, bitcoin.id],
      presentation: "dialog",
    });
    expect(store.getState().modularDialog.dialogParams?.currencies).toBeUndefined();
    expect(store.getState().modularDialog.dialogParams?.onAccountSelected).toBeUndefined();
  });

  it("should open and reset the embedded presentation", async () => {
    const { result, store } = renderHook(() => useOpenCurrencyFlow());

    const selection = result.current.openCurrencyFlow([ethereum.id], {
      presentation: "embedded",
    });

    expect(store.getState().modularDialog.dialogParams).toMatchObject({
      networkIds: [ethereum.id],
      presentation: "embedded",
    });

    act(() => {
      store.getState().modularDialog.dialogParams?.onClose?.();
    });

    await expect(selection).resolves.toBeNull();
    expect(store.getState().modularDialog.dialogParams).toBeNull();
  });

  it("should resolve the selected currency and close the dialog once", async () => {
    const onResolved = jest.fn();
    const { result, store } = renderHook(() => useOpenCurrencyFlow());
    const selection = result.current.openCurrencyFlow([ethereum.id]).then(onResolved);
    const { onAssetSelected, onClose } = store.getState().modularDialog.dialogParams ?? {};

    act(() => {
      onAssetSelected?.(ethereum);
      onClose?.();
    });
    await selection;

    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith(ethereum);
    expect(store.getState().modularDialog.isOpen).toBe(false);
  });

  it("should resolve null when the dialog closes", async () => {
    const { result, store } = renderHook(() => useOpenCurrencyFlow());
    const selection = result.current.openCurrencyFlow([ethereum.id]);

    act(() => {
      store.getState().modularDialog.dialogParams?.onClose?.();
    });

    await expect(selection).resolves.toBeNull();
    expect(store.getState().modularDialog.isOpen).toBe(false);
  });

  it("should cancel its pending selection before opening another one", async () => {
    const { result, store } = renderHook(() => useOpenCurrencyFlow());
    const firstSelection = result.current.openCurrencyFlow([bitcoin.id]);
    const firstOnAssetSelected = store.getState().modularDialog.dialogParams?.onAssetSelected;
    const secondSelection = result.current.openCurrencyFlow([ethereum.id]);

    await expect(firstSelection).resolves.toBeNull();

    act(() => {
      firstOnAssetSelected?.(bitcoin);
    });

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.dialogParams?.networkIds).toEqual([ethereum.id]);

    act(() => {
      store.getState().modularDialog.dialogParams?.onAssetSelected?.(ethereum);
    });

    await expect(secondSelection).resolves.toBe(ethereum);
  });
});
