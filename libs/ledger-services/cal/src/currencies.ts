import network from "@ledgerhq/live-network";
import { DEFAULT_OPTION, getCALDomain, type ServiceOption } from "./common";

// https://github.com/LedgerHQ/crypto-assets-service/blob/master/modules/api/src/main/scala/co/ledger/cal/api/assets/v1/model/asset/Currency.scala#L95
const OUTPUT_FILTER =
  "id,type,chain_id,coin_type,confirmations_needed,deposit_amount,family,has_tokens,name,network_magic,network,network_type,symbol,ticker,units,descriptor_exchange_app,blockchain_name,exchange_app_config_serialized,exchange_app_signature";

export type Unit = {
  code: string;
  name: string;
  magnitude: number;
};
type CurrencyDataResponse = {
  type: "coin" | "token";
  id: string;
  blockchain_name: string;
  chain_id?: number;
  coin_type: number;
  descriptor_exchange_app: {
    data: string;
    signatures: {
      prod: string;
      test: string;
    };
  };
  name: string;
  network: string;
  network_type: "main" | "test";
  symbol: string;
  ticker: string;
  units: Unit[];
};

export class NoCurrencyFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoCurrencyFound";
  }
}

export type CurrencyData = {
  id: string;
  chainId?: number;
  coinType: number;
  config: string;
  signature: string;
  symbol: string;
  ticker: string;
  units: Unit[];
};

export async function findCurrencyData(
  id: string,
  { env = "prod", signatureKind = "prod", ref = undefined }: ServiceOption = DEFAULT_OPTION,
): Promise<CurrencyData> {
  // https://github.com/LedgerHQ/crypto-assets-service/blob/master/modules/service/src/main/scala/co/ledger/cal/service/api/ApiCALService.scala#L237
  const { data: currencyData } = await network<CurrencyDataResponse[]>({
    url: `${getCALDomain(env)}/v1/currencies`,
    params: {
      output: OUTPUT_FILTER,
      id,
      ref,
    },
  });
  if (!currencyData.length) {
    throw new NoCurrencyFound(`CAL currencies, missing configuration for ${id}`);
  }
  if (currencyData.length !== 1) {
    throw new NoCurrencyFound(`CAL currencies, multiple configurations found for ${id}`);
  }

  return {
    id: currencyData[0].id,
    chainId: currencyData[0]?.chain_id,
    coinType: currencyData[0].coin_type,
    config: currencyData[0].descriptor_exchange_app.data,
    signature: currencyData[0].descriptor_exchange_app.signatures[signatureKind],
    symbol: currencyData[0].symbol,
    ticker: currencyData[0].ticker,
    units: currencyData[0].units,
  };
}
