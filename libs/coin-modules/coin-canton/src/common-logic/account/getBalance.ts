import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getBalance as gatewayGetBalance, type InstrumentBalance } from "../../network/gateway";
import coinConfig from "../../config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const useGateway = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).useGateway === true;
const getNativeId = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).nativeInstrumentId;

function adaptInstrument(currency: CryptoCurrency, instrument: InstrumentBalance): Balance {
  return {
    value: BigInt(instrument.amount),
    locked: instrument.locked === true ? BigInt(instrument.amount) : BigInt(0),
    asset:
      getNativeId(currency) === instrument.instrument_id
        ? { type: "native" }
        : { type: "token", assetReference: instrument.instrument_id },
  };
}

export async function getBalance(currency: CryptoCurrency, partyId: string): Promise<Balance[]> {
  if (useGateway(currency))
    return (await gatewayGetBalance(currency, partyId)).map(instrument =>
      adaptInstrument(currency, instrument),
    );
  else throw new Error("Not implemented");
}
