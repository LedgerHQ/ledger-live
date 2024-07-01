import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { AxiosResponse, Method } from "axios";
import { ChainId, ICommandResult, Pact, createClient } from "@kadena/client";
import { GetInfoResponse, GetTxnsResponse } from "./types";
import { PactCommandObject } from "../hw-app-kda/Kadena";
import { KadenaOperation } from "../types";
import { KDA_CHAINWEB_VER, KDA_NETWORK } from "../constants";

const getKadenaURL = (subpath?: string): string => {
  const baseUrl = getEnv("API_KADENA_ENDPOINT");
  if (!baseUrl) throw new Error("API indexer base URL not available");

  return `${baseUrl}${subpath ?? ""}`;
};

export const getKadenaPactURL = (chainId: string): string => {
  return `${getKadenaURL()}/chainweb/${KDA_CHAINWEB_VER}/${KDA_NETWORK}/chain/${chainId}/pact`;
};

const KadenaApiWrapper = async <T>(path: string, body: any, method: Method) => {
  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const rawResponse = await network({ url: path, method, data: body });
  if (rawResponse && rawResponse.data && rawResponse.data.details?.error_message) {
    log("error", rawResponse.data.details?.error_message);
  }

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data, headers } = rawResponse as AxiosResponse<T>;

  log("http", path);
  return { data, headers };
};

export const fetchNetworkInfo = async () => {
  const res = await KadenaApiWrapper<GetInfoResponse>(getKadenaURL("/info"), undefined, "GET");

  return res.data;
};

export const fetchCoinDetailsForAccount = async (
  address: string,
  chains: ChainId[],
): Promise<{ [K in keyof ChainId]: string }> => {
  const txn = Pact.builder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .execution((Pact.modules as any).coin.details(address))
    .setNonce("local")
    .setMeta({
      chainId: "",
    })
    .createTransaction();

  const promises: Promise<ICommandResult>[] = [];
  for (const id of chains.sort()) {
    const c = createClient(getKadenaPactURL(id));
    promises.push(c.dirtyRead(txn));
  }

  const results = await Promise.all(promises);

  const balances = results.reduce((lastVal, val, idx) => {
    const r = val.result;
    if (r.status === "failure") {
      return lastVal;
    }

    return { ...lastVal, [idx]: r.data.balance };
  }, {});

  return balances;
};

export const fetchTransactions = async (address: string) => {
  const url = getKadenaURL("/txs/account");
  const result: GetTxnsResponse[] = [];
  let next = "";

  for (;;) {
    let query = "";
    if (next === "") {
      query = `${url}/${address}?limit=100&token=coin`;
    } else {
      query = `${url}/${address}?next=${next}&limit=100&token=coin`;
    }

    const res = await KadenaApiWrapper<GetTxnsResponse[]>(query, {}, "GET");

    result.push(...res.data);

    const headers = res.headers;
    next = headers["Chainweb-Next"] ?? "";
    if (next == "") {
      break;
    }
  }

  return result;
};

export const broadcastTransaction = async (cmd: PactCommandObject, op: KadenaOperation) => {
  const id = op.extra.senderChainId;

  const client = createClient(getKadenaPactURL(id.toString()));

  try {
    const res = await client.local(cmd);
    if (res.result.status === "failure") {
      throw new Error((res.result.error as Error).message ?? "dry run for the transaction failed");
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err?.message;
    }
    throw err;
  }

  await client.submit(cmd);
};
