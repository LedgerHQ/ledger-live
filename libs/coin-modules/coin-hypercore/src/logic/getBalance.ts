import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { fetchSpotClearinghouseState } from "../network/info";
import { NATIVE_ASSET_DECIMALS, NATIVE_ASSET_SYMBOL } from "../types";

const NATIVE_UNIT = {
  name: NATIVE_ASSET_SYMBOL,
  code: NATIVE_ASSET_SYMBOL,
  magnitude: NATIVE_ASSET_DECIMALS,
};

/**
 * Parse a decimal string (e.g. "12.34567890") into a bigint of base units.
 * Truncates extra fractional digits beyond `decimals`.
 */
function toBaseUnits(decimalAmount: string, decimals: number): bigint {
  const [whole, fractionRaw = ""] = decimalAmount.split(".");
  const fraction = fractionRaw.slice(0, decimals).padEnd(decimals, "0");
  const normalized = `${whole}${fraction}`.replace(/^0+(?=\d)/, "");
  return BigInt(normalized === "" ? "0" : normalized);
}

export async function getBalance(address: string, currencyId?: string): Promise<Balance[]> {
  const state = await fetchSpotClearinghouseState(address, currencyId);
  const nativeBalance = state.balances?.find(b => b.coin === NATIVE_ASSET_SYMBOL);

  const total = nativeBalance ? toBaseUnits(nativeBalance.total, NATIVE_ASSET_DECIMALS) : 0n;
  const hold = nativeBalance ? toBaseUnits(nativeBalance.hold, NATIVE_ASSET_DECIMALS) : 0n;

  return [
    {
      value: total,
      asset: { type: "native", name: NATIVE_ASSET_SYMBOL, unit: NATIVE_UNIT },
      locked: hold,
    },
  ];
}
