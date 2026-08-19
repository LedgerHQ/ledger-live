import type {
  CoinModuleApi,
  AssetInfo,
  Balance,
  Block,
  BlockInfo,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData as craftTransactionDataImpl } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import network from "@ledgerhq/live-network";

// The coin-service is a stateless HTTP backend, so it ignores the framework v6 Context; every
// method still takes it first to satisfy the CoinModuleApi contract.

function adaptOp<T extends AssetInfo>(backendOp: Operation<T>): Operation<T> {
  const { date } = backendOp.tx;
  const newDate = new Date(date);

  return {
    ...backendOp,
    value: BigInt(backendOp.value),
    tx: { ...backendOp.tx, fees: BigInt(backendOp.tx.fees), date: newDate },
  };
}

const COIN_SERVICE_URL = "http://0.0.0.0:3000";

const buildBroadcast = networkFamily =>
  async function broadcast(_context: Context<any>, signedOperation: string): Promise<string> {
    const { data } = await network<
      {
        transactionIdentifier: string;
      },
      {
        rawTransaction: string;
      }
    >({
      method: "POST",
      url: `${COIN_SERVICE_URL}/${networkFamily}/transaction/broadcast`,
      data: {
        rawTransaction: signedOperation,
      },
    });
    return data.transactionIdentifier;
  };

const buildCombine = networkFamily =>
  async function combine(
    _context: Context<any>,
    tx: string,
    signature: string[],
    options?: { pubkey?: string },
  ): Promise<string> {
    const { data } = await network<
      {
        signedTransaction: string;
      },
      unknown
    >({
      method: "POST",
      url: `${COIN_SERVICE_URL}/${networkFamily}/transaction/combine`,
      data: {
        raw_transaction: tx,
        signature: signature,
        pubkey: options?.pubkey,
      },
    });
    return data.signedTransaction;
  };

const buildEstimateFees = networkFamily =>
  async function estimateFees(
    _context: Context<any>,
    intent: TransactionIntent<any>,
  ): Promise<FeeEstimation> {
    const { data } = await network<{ fee: string }, unknown>({
      method: "POST",
      url: `${COIN_SERVICE_URL}/${networkFamily}/transaction/estimate`,
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
  async function validateIntent(
    _context: Context<any>,
    transaction: TransactionIntent,
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
      url: `${COIN_SERVICE_URL}/${networkFamily}/transaction/validate`,
      data: {
        transaction,
      },
    });
    return data;
  };

const buildGetBalance = (networkFamily: string) =>
  async function getBalance(_context: Context<any>, address: string): Promise<Balance[]> {
    const { data } = await network<Balance, unknown>({
      method: "GET",
      url: `${COIN_SERVICE_URL}/${networkFamily}/account/${address}/balance`,
    });

    return [
      {
        value: BigInt(data.value),
        asset: data.asset,
        locked: BigInt(data?.locked ?? "0"),
      },
    ];
  };

const buildGetNextSequence = (networkFamily: string) =>
  async function getNextSequence(_context: Context<any>, address: string): Promise<bigint> {
    const { data } = await network<bigint, unknown>({
      method: "GET",
      url: `${COIN_SERVICE_URL}/${networkFamily}/account/${address}/info`,
    });

    return data;
  };

const buildListOperations = networkFamily =>
  async function listOperations(
    _context: Context<any>,
    address: string,
    { minHeight = 0 }: ListOperationsOptions,
  ): Promise<Page<Operation<any>>> {
    const { data } = await network<{ operations: Operation<any>[] }, unknown>({
      method: "GET",
      url: `${COIN_SERVICE_URL}/${networkFamily}/account/${address}/operations`,
      data: {
        from: minHeight,
      },
    });
    return { items: data.operations.map(op => adaptOp(op)), next: undefined };
  };

const buildLastBlock = networkFamily =>
  async function lastBlock(_context: Context<any>): Promise<BlockInfo> {
    const { data } = await network<any, unknown>({
      method: "GET",
      url: `${COIN_SERVICE_URL}/${networkFamily}/lastblock`,
    });
    return {
      height: data.height,
      time: new Date(data.time),
      hash: data.hash,
    };
  };

const buildCraftTransaction = networkFamily =>
  async function craftTransaction(
    _context: Context<any>,
    intent: TransactionIntent<any>,
  ): Promise<CraftedTransaction> {
    const { data } = await network<CraftedTransaction, unknown>({
      method: "POST",
      url: `${COIN_SERVICE_URL}/${networkFamily}/transaction/encode`,
      data: {
        intent: {
          ...intent,
          amount: intent.amount.toString(10),
        },
      },
    });
    return data;
  };

export const getNetworkCoinModuleApi = (networkFamily: string) =>
  ({
    broadcast: buildBroadcast(networkFamily),
    combine: buildCombine(networkFamily),
    validateIntent: buildValidateIntent(networkFamily),
    estimateFees: buildEstimateFees(networkFamily),
    getBalance: buildGetBalance(networkFamily),
    getNextSequence: buildGetNextSequence(networkFamily),
    listOperations: buildListOperations(networkFamily),
    lastBlock: buildLastBlock(networkFamily),
    craftTransaction: buildCraftTransaction(networkFamily),
    craftRawTransaction: (
      _context: Context<any>,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    getBlock(_context: Context<any>, _height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context: Context<any>, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(
      _context: Context<any>,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: Context<any>,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(
      _context: Context<any>,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateAddress(_context: Context<any>, _address: string): Promise<boolean> {
      throw new Error("validateAddress is not supported");
    },
    // TODO(BACK-11825): wire to the coin-service `call` endpoint once it is exposed over the network.
    async call(_context: Context<any>) {
      throw new Error("call is not supported");
    },
    async register() {
      throw new Error("register is not supported");
    },
    craftTransactionData: (_context: Context<any>, intent: TransactionIntent) =>
      craftTransactionDataImpl(intent),
  }) satisfies CoinModuleApi<any> & BridgeApi;
