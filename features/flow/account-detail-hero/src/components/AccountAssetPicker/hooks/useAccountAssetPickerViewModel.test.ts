import { act, renderHook } from "@testing-library/react";
import type { AccountAssetPickerRow } from "../AccountAssetPicker.types";
import { useAccountAssetPickerViewModel } from "./useAccountAssetPickerViewModel";

const row = (id: string): AccountAssetPickerRow => ({
  id,
  ledgerId: id,
  name: id,
  ticker: id,
  cryptoAmount: "1",
});

const bitcoin = [row("bitcoin")];
const ethereum = [row("ethereum")];

type Props = Readonly<{ open: boolean; rows: readonly AccountAssetPickerRow[] }>;

function renderViewModel(initialProps: Props) {
  return renderHook((props: Props) => useAccountAssetPickerViewModel(props), { initialProps });
}

describe("useAccountAssetPickerViewModel", () => {
  it("mounts no content before the picker first opens", () => {
    const { result } = renderViewModel({ open: false, rows: [] });

    expect(result.current.isContentMounted).toBe(false);
    expect(result.current.rows).toEqual([]);
  });

  it("follows the rows while open", () => {
    const { result, rerender } = renderViewModel({ open: true, rows: bitcoin });

    rerender({ open: true, rows: ethereum });

    expect(result.current.isContentMounted).toBe(true);
    expect(result.current.rows).toBe(ethereum);
  });

  it("keeps the last rows while closing, until the picker is hidden", () => {
    const { result, rerender } = renderViewModel({ open: true, rows: bitcoin });

    rerender({ open: false, rows: [] });
    expect(result.current.isContentMounted).toBe(true);
    expect(result.current.rows).toBe(bitcoin);

    act(() => result.current.onHidden());
    expect(result.current.isContentMounted).toBe(false);
    expect(result.current.rows).toEqual([]);
  });

  it("keeps the content when it is reopened before the hide completes", () => {
    const { result, rerender } = renderViewModel({ open: true, rows: bitcoin });

    rerender({ open: false, rows: [] });
    rerender({ open: true, rows: ethereum });
    act(() => result.current.onHidden());

    expect(result.current.isContentMounted).toBe(true);
    expect(result.current.rows).toBe(ethereum);
  });
});
