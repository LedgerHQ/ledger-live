import {
  Account,
  Balance,
  Block,
  BlockInfo,
  Operation,
  FeeEstimation,
  Pagination,
  TransactionIntent,
  Transaction,
  TransactionValidation,
  AccountInfo,
  Api,
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

const buildBroadcast = (networkFamily: string) =>
  async function broadcast(signedOperation: string): Promise<string> {
    const { data } = await network<
      {
        transactionIdentifier: string;
      },
      {
        rawTransaction: string;
      }
    >({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/broadcast`,
      data: {
        rawTransaction: signedOperation,
      },
    });
    return data.transactionIdentifier;
  };

const buildCombine = (networkFamily: string) =>
  async function combine(tx: string, signature: string, pubKey?: string): Promise<string> {
    const { data } = await network<
      {
        signedTransaction: string;
      },
      unknown
    >({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/combine`,
      data: {
        raw_transaction: tx,
        signature: signature,
        pubkey: pubKey,
      },
    });
    return data.signedTransaction;
  };

const buildEstimateFees = (networkFamily: string) =>
  async function estimateFees(intent: TransactionIntent<any>): Promise<FeeEstimation> {
    const { data } = await network<{ fee: string }, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/estimate`,
      data: {
        intent: {
          ...intent,
          amount: intent.amount.toString(10),
        },
      },
    });
    return {
      value: BigInt(data.fee),
    };
  };

const buildValidateIntent = (networkFamily: string) =>
  async function validateIntent(
    account: Account,
    transaction: Transaction,
  ): Promise<TransactionValidation> {
    const { data } = await network<
      {
        errors: Record<string, Error>;
        warnings: Record<string, Error>;
        estimatedFees: bigint;
        amount: bigint;
        totalSpent: bigint;
      },
      unknown
    >({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/validate`,
      data: {
        transaction,
        account,
      },
    });
    return data;
  };

// FIXME: shouldn't hardcode
type AssetInfo = {
  type: "native"; // or "token" if applicable
};

const buildGetBalance = (networkFamily: string) =>
  async function getBalance(address: string): Promise<Balance<AssetInfo>[]> {
    const { data } = await network<Balance<AssetInfo>, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/balance`,
    });

    return [
      {
        value: BigInt(data.value),
        asset: data.asset,
      },
    ];
  };

const buildGetAccountInfo = (networkFamily: string) =>
  async function getBalance(address: string): Promise<AccountInfo> {
    const { data } = await network<AccountInfo, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/info`,
    });

    return data;
  };

const buildListOperations = (networkFamily: string) =>
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

const buildLastBlock = (networkFamily: string) =>
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

const buildCraftTransaction = (networkFamily: string) =>
  async function craftTransaction(intent: TransactionIntent<any>): Promise<string> {
    const { data } = await network<any, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/encode`,
      data: {
        intent: {
          ...intent,
          amount: intent.amount.toString(10),
        },
      },
    });
    return data.rawTransaction;
  };

export const getNetworkAlpacaApi = (networkFamily: string) =>
  ({
    broadcast: buildBroadcast(networkFamily),
    combine: buildCombine(networkFamily),
    validateIntent: buildValidateIntent(networkFamily),
    estimateFees: buildEstimateFees(networkFamily),
    getBalance: buildGetBalance(networkFamily),
    getAccountInfo: buildGetAccountInfo(networkFamily),
    listOperations: buildListOperations(networkFamily),
    lastBlock: buildLastBlock(networkFamily),
    craftTransaction: buildCraftTransaction(networkFamily),
    getBlock(_height): Promise<Block<any>> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
  }) satisfies Api<any>;
