import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { CantonContext } from "../config";
import { isInstrument, type NativeInstrument } from "../logic/asset";
import { getBalance as gatewayGetBalance, isGatewayEnabled } from "../network/gateway";
import type { InstrumentBalance } from "../types/gateway";

export type CantonBalance = Balance & {
  utxoCount: number;
  instrumentId: string;
  adminId: string;
};

function adaptInstrument(native: NativeInstrument, instrument: InstrumentBalance): CantonBalance {
  return {
    value: BigInt(instrument.amount),
    locked: instrument.locked === true ? BigInt(instrument.amount) : BigInt(0),
    asset: isInstrument(native, instrument.instrument_id, instrument.admin_id)
      ? { type: native.instrumentId }
      : { type: "token", assetReference: instrument.instrument_id },
    utxoCount: instrument.utxo_count,
    instrumentId: instrument.instrument_id,
    adminId: instrument.admin_id,
  };
}

export async function getInstrumentBalances(
  context: CantonContext,
  partyId: string,
  native: NativeInstrument,
): Promise<CantonBalance[]> {
  const config = await context.config();
  if (isGatewayEnabled(config)) {
    const balances = await gatewayGetBalance(config, partyId);
    return balances.map(instrument => adaptInstrument(native, instrument));
  } else throw new Error("Not implemented");
}
