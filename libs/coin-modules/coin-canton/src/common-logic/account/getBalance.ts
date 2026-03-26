import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig, { isGatewayEnabled } from "../../config";
import { getBalance as gatewayGetBalance } from "../../network/gateway";
import type { InstrumentBalance } from "../../types/gateway";

export type CantonBalance = Balance & {
  utxoCount: number;
  instrumentId: string;
  adminId: string;
};

const getNativeId = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency.id).nativeInstrumentId;

function adaptInstrument(currency: CryptoCurrency, instrument: InstrumentBalance): CantonBalance {
  return {
    value: BigInt(instrument.amount),
    locked: instrument.locked === true ? BigInt(instrument.amount) : BigInt(0),
    asset:
      getNativeId(currency) === instrument.instrument_id
        ? { type: getNativeId(currency) }
        : { type: "token", assetReference: instrument.instrument_id },
    utxoCount: instrument.utxo_count,
    instrumentId: instrument.instrument_id,
    adminId: instrument.admin_id,
  };
}

export async function getBalance(
  currency: CryptoCurrency,
  partyId: string,
): Promise<CantonBalance[]> {
  if (isGatewayEnabled(currency)) {
    const balances = await gatewayGetBalance(currency, partyId);
    return balances.map(instrument => adaptInstrument(currency, instrument));
  } else throw new Error("Not implemented");
}
