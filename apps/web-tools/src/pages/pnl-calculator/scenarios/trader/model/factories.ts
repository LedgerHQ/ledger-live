import { getAsset } from "./assets";
import type {
  AssetDescriptor,
  TraderAccountState,
  TraderAssetId,
  TraderOpInput,
  TraderOpKind,
  TraderOpRow,
} from "./types";

let _rowSeq = 0;
function makeRowId(): string {
  _rowSeq += 1;
  return `row-${_rowSeq}`;
}

let _accountSeq = 0;
function makeAccountId(): string {
  _accountSeq += 1;
  return `acc-${_accountSeq}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function makeDefaultOpInput(
  asset: AssetDescriptor,
  kind: TraderOpKind = "IN",
): TraderOpInput {
  return {
    kind,
    amount: asset.defaultAmount,
    priceUsd: asset.defaultPrice,
    date: todayIso(),
  };
}

export function makeRow(values: TraderOpInput): TraderOpRow {
  return { id: makeRowId(), ...values };
}

function makeInitialRows(asset: AssetDescriptor): TraderOpRow[] {
  return [makeRow(makeDefaultOpInput(asset, "IN"))];
}

export function makeInitialAccount(assetId: TraderAssetId): TraderAccountState {
  const asset = getAsset(assetId);
  return {
    id: makeAccountId(),
    assetId,
    currentPriceUsd: asset.defaultLatestPrice,
    rows: makeInitialRows(asset),
  };
}

/** Fresh defaults for a different asset, keeping the account's stable id. */
export function resetAccountToAsset(
  prev: TraderAccountState,
  nextAssetId: TraderAssetId,
): TraderAccountState {
  const asset = getAsset(nextAssetId);
  return {
    id: prev.id,
    assetId: nextAssetId,
    currentPriceUsd: asset.defaultLatestPrice,
    rows: makeInitialRows(asset),
  };
}
