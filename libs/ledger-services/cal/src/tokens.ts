import network from "@ledgerhq/live-network";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { DEFAULT_OPTION, getCALDomain, type ServiceOption } from "./common";

const OUTPUT_FILTER =
  "id,name,network,network_family,network_type,exchange_app_config_serialized,live_signature,ticker,decimals,blockchain_name,chain_id,contract_address,descriptor,descriptor_exchange_app,units,symbol";

export type Unit = {
  code: string;
  name: string;
  magnitude: number;
};

type TokenRequest = {
  output: string;
  ref?: string;
  id?: string;
  blockchain_name?: string;
  ticker?: string;
};
type TokenDataResponse = {
  id: string;
  blockchain_name: string;
  chain_id?: number;
  contract_address: string;
  decimals: number;
  descriptor_exchange_app: {
    data: string;
    descriptorType: string;
    signatures: {
      prod: string;
      test: string;
    };
  };
  exchange_app_config_serialized: string;
  name: string;
  network: string;
  network_family: string;
  network_type: "main" | "test";
  symbol: string;
  ticker: string;
  units: Unit[];
};

export class NoTokenFound extends Error {
  constructor() {
    super();
    this.name = "NoTokenFound";
  }
}

export type TokenData = {
  id: string;
  chainId?: number;
  contractAddress?: string;
  config: string;
  decimals: number;
  name: string;
  network: string;
  family: string;
  networkType: "main" | "test";
  signature: string;
  symbol: string;
  ticker: string;
  units: Unit[];
};

export const findCachedToken = makeLRUCache(
  async (filter, opt) => findToken(filter, opt),
  filter => ("blockchain" in filter ? filter.blockchain + filter.ticker : filter.id),
  hours(1),
);

export async function findToken(
  filter: { id: string } | { blockchain: string; ticker: string },
  { env = "prod", signatureKind = "prod", ref = undefined }: ServiceOption = DEFAULT_OPTION,
): Promise<TokenData> {
  let params: TokenRequest = {
    output: OUTPUT_FILTER,
    ref,
  };
  if ("blockchain" in filter) {
    params = {
      ...params,
      blockchain_name: filter.blockchain,
      ticker: filter.ticker,
    };
  } else {
    params = {
      ...params,
      id: filter.id,
    };
  }

  // https://github.com/LedgerHQ/crypto-assets-service/blob/master/modules/service/src/main/scala/co/ledger/cal/service/api/ApiCALService.scala#L259
  const { data } = await network<TokenDataResponse[]>({
    url: `${getCALDomain(env)}/v1/tokens`,
    params,
  });
  if (!data.length) {
    throw new NoTokenFound();
  }

  return {
    id: data[0].id,
    chainId: data[0]?.chain_id,
    contractAddress: data[0]?.contract_address,
    config: data[0].descriptor_exchange_app.data,
    decimals: data[0].decimals,
    name: data[0].name,
    network: data[0].network,
    family: data[0].network_family,
    networkType: data[0].network_type,
    signature: data[0].descriptor_exchange_app.signatures[signatureKind],
    symbol: data[0].symbol,
    ticker: data[0].ticker,
    units: data[0].units,
  };
}
