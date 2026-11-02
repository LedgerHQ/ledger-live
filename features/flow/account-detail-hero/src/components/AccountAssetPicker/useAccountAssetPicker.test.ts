import { act, renderHook } from "@testing-library/react";
import type { AccountAssetPickerSource } from "./AccountAssetPicker.types";
import { useAccountAssetPicker } from "./useAccountAssetPicker";

type Asset = Readonly<{ id: string; value: number }>;

const asset = (id: string, value = 1): Asset => ({ id, value });

const toSources = (items: readonly Asset[]): readonly AccountAssetPickerSource<Asset>[] =>
  items.map(item => ({
    item,
    sortValue: item.value,
    row: {
      id: item.id,
      ledgerId: item.id,
      name: item.id,
      ticker: item.id,
      cryptoAmount: "1",
      countervalue: `$${item.value}`,
    },
  }));

describe("useAccountAssetPicker", () => {
  it("picks the only asset without opening the picker", () => {
    const { result } = renderHook(() => useAccountAssetPicker(toSources));
    const onPicked = jest.fn();
    const only = asset("bitcoin");

    act(() => result.current.pickAsset([only], onPicked));

    expect(onPicked).toHaveBeenCalledWith(only);
    expect(result.current.pickerProps.open).toBe(false);
    expect(result.current.pickerProps.rows).toEqual([]);
  });

  it("does nothing when there is no asset", () => {
    const { result } = renderHook(() => useAccountAssetPicker(toSources));
    const onPicked = jest.fn();

    act(() => result.current.pickAsset([], onPicked));

    expect(onPicked).not.toHaveBeenCalled();
    expect(result.current.pickerProps.open).toBe(false);
  });

  it("opens the picker with rows ordered by countervalue when several assets qualify", () => {
    const { result } = renderHook(() => useAccountAssetPicker(toSources));
    const onPicked = jest.fn();

    act(() => result.current.pickAsset([asset("bitcoin", 1), asset("ethereum", 20)], onPicked));

    expect(onPicked).not.toHaveBeenCalled();
    expect(result.current.pickerProps.open).toBe(true);
    expect(result.current.pickerProps.rows.map(row => row.id)).toEqual(["ethereum", "bitcoin"]);
  });

  it("returns the picked asset and closes", () => {
    const { result } = renderHook(() => useAccountAssetPicker(toSources));
    const bitcoin = asset("bitcoin", 1);
    const onPicked = jest.fn();

    act(() => result.current.pickAsset([bitcoin, asset("ethereum", 2)], onPicked));
    act(() => result.current.pickerProps.onSelect("bitcoin"));

    expect(onPicked).toHaveBeenCalledWith(bitcoin);
    expect(result.current.pickerProps.open).toBe(false);
  });

  it("closes without picking when dismissed", () => {
    const { result } = renderHook(() => useAccountAssetPicker(toSources));
    const onPicked = jest.fn();

    act(() => result.current.pickAsset([asset("bitcoin"), asset("ethereum")], onPicked));
    act(() => result.current.pickerProps.onClose());

    expect(onPicked).not.toHaveBeenCalled();
    expect(result.current.pickerProps.open).toBe(false);
  });
});
