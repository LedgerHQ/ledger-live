import { Balance } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../../config";
import { getBalance as gatewayGetBalance } from "../../network/gateway";
import type { InstrumentBalance } from "../../types/gateway";

export type CantonBalance = Balance & {
  utxoCount: number;
  instrumentId: string;
};

const useGateway = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).useGateway === true;
const getNativeId = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).nativeInstrumentId;

function adaptInstrument(currency: CryptoCurrency, instrument: InstrumentBalance): CantonBalance {
  return {
    value: BigInt(instrument.amount),
    locked: instrument.locked === true ? BigInt(instrument.amount) : BigInt(0),
    asset:
      getNativeId(currency) === instrument.instrument_id
        ? { type: "native" }
        : { type: "token", assetReference: instrument.instrument_id },
    utxoCount: instrument.utxo_count,
    instrumentId: instrument.instrument_id,
  };
}

export async function getBalance(
  currency: CryptoCurrency,
  partyId: string,
): Promise<CantonBalance[]> {
  if (useGateway(currency))
    return (await gatewayGetBalance(currency, partyId)).map(instrument =>
      adaptInstrument(currency, instrument),
    );
  else throw new Error("Not implemented");
}
