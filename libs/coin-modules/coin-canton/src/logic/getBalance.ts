import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { CantonContext } from "../config";
import { getBalance as gatewayGetBalance, isGatewayEnabled } from "../network/gateway";
import type { InstrumentBalance } from "../types/gateway";

export type CantonBalance = Balance & {
  utxoCount: number;
  instrumentId: string;
  adminId: string;
};

function adaptInstrument(nativeInstrumentId: string, instrument: InstrumentBalance): CantonBalance {
  return {
    value: BigInt(instrument.amount),
    locked: instrument.locked === true ? BigInt(instrument.amount) : BigInt(0),
    asset:
      nativeInstrumentId === instrument.instrument_id
        ? { type: nativeInstrumentId }
        : { type: "token", assetReference: instrument.instrument_id },
    utxoCount: instrument.utxo_count,
    instrumentId: instrument.instrument_id,
    adminId: instrument.admin_id,
  };
}

export async function getBalance(
  context: CantonContext,
  partyId: string,
): Promise<CantonBalance[]> {
  const config = await context.config();
  if (isGatewayEnabled(config)) {
    const balances = await gatewayGetBalance(config, partyId);
    return balances.map(instrument => adaptInstrument(config.nativeInstrumentId, instrument));
  } else throw new Error("Not implemented");
}
