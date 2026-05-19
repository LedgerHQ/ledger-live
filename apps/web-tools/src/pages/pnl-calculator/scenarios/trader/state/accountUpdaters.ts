import { getAsset } from "../model/assets";
import { makeDefaultOpInput, makeRow, resetAccountToAsset } from "../model/factories";
import type { TraderAccountState, TraderAssetId, TraderOpInput, TraderOpRow } from "../model/types";

export function withAssetId(prev: TraderAccountState, nextId: TraderAssetId): TraderAccountState {
  if (prev.assetId === nextId) return prev;
  return resetAccountToAsset(prev, nextId);
}

export function withCurrentPrice(prev: TraderAccountState, nextPrice: string): TraderAccountState {
  return { ...prev, currentPriceUsd: nextPrice };
}

export function withRowAppended(
  prev: TraderAccountState,
  values?: TraderOpInput,
): TraderAccountState {
  const asset = getAsset(prev.assetId);
  const row: TraderOpRow = makeRow(values ?? makeDefaultOpInput(asset, "IN"));
  return { ...prev, rows: [...prev.rows, row] };
}

export function withRowUpdated(
  prev: TraderAccountState,
  rowId: string,
  values: TraderOpInput,
): TraderAccountState {
  return {
    ...prev,
    rows: prev.rows.map(r => (r.id === rowId ? { id: rowId, ...values } : r)),
  };
}

export function withRowRemoved(prev: TraderAccountState, rowId: string): TraderAccountState {
  return { ...prev, rows: prev.rows.filter(r => r.id !== rowId) };
}
