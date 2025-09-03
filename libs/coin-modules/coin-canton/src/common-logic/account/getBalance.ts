import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getBalance as gatewayGetBalance, type InstrumentBalance } from "../../network/gateway";
import coinConfig from "../../config";

const useGateway = () => coinConfig.getCoinConfig().useGateway === true;
const getNativeId = () => coinConfig.getCoinConfig().nativeInstrumentId;

function adaptInstrument(instrument: InstrumentBalance): Balance {
  return {
    value: BigInt(instrument.amount),
    locked: instrument.locked === true ? BigInt(instrument.amount) : BigInt(0),
    asset:
      getNativeId() === instrument.instrumentId
        ? { type: "native" }
        : { type: "token", assetReference: instrument.instrumentId },
  };
}

export async function getBalance(partyId: string): Promise<Balance[]> {
  if (useGateway())
    return (await gatewayGetBalance(partyId)).map(instrument => adaptInstrument(instrument));
  else throw new Error("Not implemented");
}
