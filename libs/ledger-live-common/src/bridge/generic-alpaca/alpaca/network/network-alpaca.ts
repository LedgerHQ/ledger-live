import type {
  Api,
  Asset,
  BlockInfo,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import network from "@ledgerhq/live-network";

function adaptOp(backendOp: any): Operation<any> {
  const { date } = backendOp.tx;
  const newDate = new Date(date);

  return {
    ...backendOp,
    value: BigInt(backendOp.value),
    tx: { ...backendOp.tx, fees: BigInt(backendOp.tx.fees), date: newDate },
  };
}

const ALPACA_URL = "http://0.0.0.0:3000";

const buildBroadcast = networkFamily =>
  async function broadcast(signedOperation: string): Promise<string> {
    const { data } = await network<string, string>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/broadcast`,
      data: signedOperation,
    });
    return data;
  };

const buildCombine = _networkFamily =>
  function combine(_tx: string, _signature: string, _pubKey?: string): string {
    return "";
    /*const { data } = await network<string, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/combine`,
      data: {
        rawTransaction: tx,
        signature,
        pubKey,
      },
    });
    return data;*/
  };

const buildEstimateFees = networkFamily =>
  async function estimateFees(intent: TransactionIntent<any>): Promise<bigint> {
    const { data } = await network<bigint, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/combine`,
      data: {
        intent,
      },
    });
    return data;
  };

const buildGetBalance = networkFamily =>
  async function getBalance(address: string): Promise<bigint> {
    const { data } = await network<Asset, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/balance`,
    });
    return BigInt(data.native);
  };

const buildListOperations = networkFamily =>
  async function listOperations(
    address: string,
    pagination: Pagination,
  ): Promise<[Operation<any>[], string]> {
    const { data } = await network<{ operations: Operation<any>[] }, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/operations`,
      data: {
        from: pagination.minHeight,
      },
    });
    return [data.operations.map(op => adaptOp(op)), ""];
  };

const buildLastBlock = networkFamily =>
  async function lastBlock(): Promise<BlockInfo> {
    const { data } = await network<any, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/lastblock`,
    });
    return {
      height: data.height,
      time: new Date(data.time),
      hash: data.hash,
    };
  };

const buildCraftTransaction = networkFamily =>
  async function craftTransaction(intent: TransactionIntent<any>): Promise<string> {
    const { data } = await network<any, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/encode`,
      data: {
        intent: intent,
      },
    });
    return data.rawTransaction;
  };

export const getNetworkAlpacaApi = (networkFamily: string) =>
  ({
    broadcast: buildBroadcast(networkFamily),
    combine: buildCombine(networkFamily),
    estimateFees: buildEstimateFees(networkFamily),
    getBalance: buildGetBalance(networkFamily),
    listOperations: buildListOperations(networkFamily),
    lastBlock: buildLastBlock(networkFamily),
    craftTransaction: buildCraftTransaction(networkFamily),
  }) satisfies Api<any>;
