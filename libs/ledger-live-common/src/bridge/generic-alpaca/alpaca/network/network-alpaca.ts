import type { Api, Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import network from "@ledgerhq/live-network";

const ALPACA_URL = "http://0.0.0.0:3000/";

const buildBroadcast = networkFamily =>
  async function broadcast(signedOperation: string): Promise<string> {
    const { data } = await network({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/broadcast`,
      data: signedOperation,
    });
    return data as string;
  };

const buildListOperations = networkFamily =>
  async function listOperations(
    address: string,
    pagination: Pagination,
  ): Promise<[Operation<any>[], string]> {
    const { data } = await network({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/operations`,
      data: {
        from: pagination.minHeight,
      },
    });
    return [data as Operation<any>[], ""] as [Operation<any>[], string];
  };

export const getNetworkAlpacaApi = (networkFamily: string) =>
  ({
    broadcast: buildBroadcast(networkFamily),
    listOperations: buildListOperations(networkFamily),
  }) satisfies Partial<Api<any>>;
