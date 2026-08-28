import type {
  CoinModuleImpl,
  AssetInfo,
  Balance,
  BlockInfo,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  TransactionIntent,
  TransactionValidation,
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

// Declared as a `CoinModuleImpl`, so it lists only what the coin-service actually serves. The
// capabilities the backend does not expose — `craftRawTransaction`, `getBlock`, `getBlockInfo`,
// `getStakes`, `getRewards`, `getValidators`, `validateAddress`, `call` and `register` — are left
// out rather than stubbed here: the resolver applies the framework's `withDefaults`, which supplies
// the same "<name> is not supported" error from a single place.
//
// `call` is the one that is meant to arrive: wire it to the coin-service `call` endpoint once that
// is exposed over the network (BACK-11825).
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
    craftTransactionData: (_context: Context<any>, intent: TransactionIntent) =>
      craftTransactionDataImpl(intent),
  }) satisfies CoinModuleImpl<any> & BridgeApi;
