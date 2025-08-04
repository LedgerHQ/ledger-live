import type {
  // Account,
  Balance,
  Block,
  BlockInfo,
  Operation,
  FeeEstimation,
  Pagination,
  TransactionIntent,
  // Transaction,
  TransactionValidation,
  // AccountInfo,
  Api,
  AssetInfo,
} from "@ledgerhq/coin-framework/api/index";
import network from "@ledgerhq/live-network";

function adaptOp<T extends AssetInfo>(backendOp: Operation<T>): Operation<T> {
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

const buildCombine = networkFamily =>
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

const buildEstimateFees = networkFamily =>
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

const buildValidateIntent = networkFamily =>
  async function validateIntent(transaction: TransactionIntent): Promise<TransactionValidation> {
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
      },
    });
    return data;
  };

const buildGetBalance = (networkFamily: string) =>
  async function getBalance(address: string): Promise<Balance[]> {
    const { data } = await network<Balance, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/balance`,
    });

    return [
      {
        value: BigInt(data.value),
        asset: data.asset,
        spendableBalance: BigInt(data.spendableBalance),
      },
    ];
  };

const buildGetSequence = (networkFamily: string) =>
  async function getSequence(address: string): Promise<number> {
    const { data } = await network<number, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/info`,
    });

    return data;
  };

const buildListOperations = networkFamily =>
  async function listOperations(
    address: string,
    pagination: Pagination = { minHeight: 0 },
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
    // getAccountInfo: buildGetAccountInfo(networkFamily),
    // getSpendableBalance(address) {
    //
    // },
    getSequence: buildGetSequence(networkFamily),
    listOperations: buildListOperations(networkFamily),
    lastBlock: buildLastBlock(networkFamily),
    craftTransaction: buildCraftTransaction(networkFamily),
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
  }) satisfies Api<any>;
