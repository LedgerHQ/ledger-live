import { AccountData, Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import aptosCoinConfig, { type AptosCoinConfig } from "../../config";

let client: Aptos;

function configureClient(config: AptosCoinConfig) {
  const aptosConfig = new AptosConfig({
    fullnode: config.node.fullnode,
    indexer: config.node.indexer,
  });

  return new Aptos(aptosConfig);
}

export default async function () {
  if (!client) {
    const config = aptosCoinConfig.getCoinConfig();
    client = configureClient(config);
  }

  return client;
}

export async function getAccount(accountAddress: string): Promise<AccountData> {
  return client.getAccountInfo({ accountAddress });
}
