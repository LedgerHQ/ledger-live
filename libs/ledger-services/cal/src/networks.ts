import network from "@ledgerhq/live-network";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { getCALDomain, type ServiceOption } from "./common";

const OUTPUT_FILTER =
  "chain_id,coin,coin_type,confirmations_needed,deposit_amount,descriptors,family,has_segwit,has_tokens,hrp,icons,id,max_transaction_version,min_transaction_version,name,network_magic,network_type,token_standard,type,wallet_app_name";

type NetworkDeviceDescriptorDataResponse = {
  data: string;
  descriptorType: string; //"network";
  descriptorVersion: string; //"v1";
  signatures: {
    prod: string;
    test: string;
  };
};
type NetworksDataResponse = {
  type: "network";
  id: string;
  name: string;
  coin: string;
  chain_id: number;
  coin_type: number;
  confirmations_needed: number;
  family: string;
  has_segwit: boolean;
  has_tokens: boolean;
  network_type: "main" | "test";
  token_standard?: string;
  wallet_app_name: string;
  icons: {
    flex: string;
    stax: string;
  };
  descriptors: {
    flex: NetworkDeviceDescriptorDataResponse;
    stax: NetworkDeviceDescriptorDataResponse;
    nanox: NetworkDeviceDescriptorDataResponse;
    nanosp: NetworkDeviceDescriptorDataResponse;
  };
};

export class NoNetworksFound extends Error {
  constructor() {
    super("NoNetworkFound");
  }
}

export type Network = {
  id: string;
  name: string;
  coin: string;
  chainId: number;
  coinType: number;
  family: string;
  networkType: "main" | "test";
  tokenStandard?: string;
  appName: string;
};

export const getCachedNetwork = makeLRUCache(
  async (id, opt) => getNetworks(id, opt),
  id => id ?? "",
  hours(1),
);

export async function getNetworks(
  id: string | null = null,
  { env = "prod", ref = undefined }: Omit<ServiceOption, "signatureKind">,
) {
  const { data } = await network<NetworksDataResponse[]>({
    url: `${getCALDomain(env)}/v1/networks`,
    params: {
      output: OUTPUT_FILTER,
      id,
      ref,
    },
  });
  if (data.length === 0 || (id !== null && data.length !== 1)) {
    throw new NoNetworksFound();
  }

  // return data;
  return data.map(network => ({
    id: network.id,
    name: network.name,
    coin: network.coin,
    chainId: network.chain_id,
    coinType: network.coin_type,
    family: network.family,
    networkType: network.network_type,
    tokenStandard: network.token_standard,
    appName: network.wallet_app_name,
  }));
}
