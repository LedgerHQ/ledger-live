import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/index";
import { pinConfig, type CantonContext } from "../config";
import {
  getBalance as gatewayGetBalance,
  getKey,
  getNativeInstrument,
  isGatewayEnabled,
} from "../network/gateway";
import type { InstrumentBalance } from "../types/gateway";
import { instrumentAsset, type NativeInstrument } from "./asset";
import { minReserveOf } from "./utils";

type InstrumentTotal = { asset: AssetInfo; value: bigint; locked: bigint };

const NATIVE_KEY = "native";

function sumByInstrument(
  native: NativeInstrument,
  rows: InstrumentBalance[],
): Map<string, InstrumentTotal> {
  const totals = new Map<string, InstrumentTotal>();
  for (const row of rows) {
    const asset = instrumentAsset(native, row.instrument_id, row.admin_id);
    const key = asset.type === "native" ? NATIVE_KEY : getKey(row.instrument_id, row.admin_id);
    const total = totals.get(key) ?? { asset, value: 0n, locked: 0n };
    const amount = BigInt(row.amount);
    total.value += amount;
    if (row.locked) total.locked += amount;
    totals.set(key, total);
  }
  return totals;
}

function withReserve(native: InstrumentTotal, minReserve: bigint): InstrumentTotal {
  const unlocked = native.value - native.locked;
  const reserved = unlocked < minReserve ? unlocked : minReserve;
  return { ...native, locked: native.locked + reserved };
}

function toBalances(
  native: NativeInstrument,
  rows: InstrumentBalance[],
  minReserve: bigint,
): Balance[] {
  const totals = sumByInstrument(native, rows);
  return [...totals].map(([key, total]) =>
    key === NATIVE_KEY ? withReserve(total, minReserve) : total,
  );
}

export async function getBalance(context: CantonContext, partyId: string): Promise<Balance[]> {
  const config = await context.config();
  if (!isGatewayEnabled(config)) throw new Error("Not implemented");
  const pinned = pinConfig(context, config);
  const [rows, native] = await Promise.all([
    gatewayGetBalance(pinned, partyId),
    getNativeInstrument(pinned),
  ]);
  return toBalances(native, rows, await minReserveOf(pinned));
}
