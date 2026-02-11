import type {
  Balance,
  Block,
  BlockInfo,
  Operation,
  FeeEstimation,
  Pagination,
  TransactionIntent,
  TransactionValidation,
  Api,
  AssetInfo,
  Cursor,
  Page,
  Stake,
  Reward,
  CraftedTransaction,
  Validator,
} from "@ledgerhq/coin-framework/api/index";
import { StellarSourceHasMultiSign } from "@ledgerhq/coin-stellar/types/errors";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  GasLessThanEstimate,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";

type SerializedTransactionIntent = Omit<TransactionIntent, "amount" | "sequence"> & {
  data?: string;
  amount: string;
  sequence?: string;
  memo?: unknown;
  destinationTag?: string;
};

type SerializedError = { name: string } & Record<string, unknown>;

function serializeTransactionIntent(
  intent: TransactionIntent<any, any>,
): SerializedTransactionIntent {
  const data =
    "data" in intent &&
    typeof intent.data === "object" &&
    !!intent.data &&
    intent.data.type === "buffer" &&
    intent.data.value instanceof Buffer
      ? "0x" + intent.data.value.toString("hex")
      : undefined;
  const amount = intent.amount.toString();
  const sequence = intent.sequence?.toString();
  const memo: {
    type?: string;
    value?: unknown;
    memos?: Record<string, unknown>;
  } = {};
  const typedMemo: { memoType?: string; memoValue?: unknown } = {};

  if ("memo" in intent) {
    if (intent.memo.type === "map" && intent.memo.memos instanceof Map) {
      memo.type = intent.memo.type;
      memo.memos = Object.fromEntries(intent.memo.memos);
    } else if (intent.memo.type === "MEMO_TEXT" && typeof intent.memo.value === "string") {
      typedMemo.memoType = intent.memo.type;
      typedMemo.memoValue = intent.memo.value;
      memo.type = intent.memo.type;
      memo.value = intent.memo.value;
    }
  }

  return {
    ...intent,
    data,
    amount,
    sequence,
    memo,
    ...typedMemo,
    destinationTag:
      typeof memo.memos?.destinationTag === "number" ||
      typeof memo.memos?.destinationTag === "string"
        ? memo.memos.destinationTag.toString()
        : undefined,
  };
}

function deserializeError(error: SerializedError): Error | undefined {
  switch (error.name) {
    case "AmountRequired":
      return new AmountRequired();
    case "RecipientRequired":
      return new RecipientRequired();
    case "InvalidAddress":
      return new InvalidAddress("", { currencyName: "currency" });
    case "InvalidAddressBecauseDestinationIsAlsoSource":
      return new InvalidAddressBecauseDestinationIsAlsoSource();
    case "NotEnoughBalance":
    case "NotEnoughSpendableBalance":
      return new NotEnoughBalance();
    case "FeeTooHigh":
      return new FeeTooHigh();
    case "GasLessThanEstimate":
      return new GasLessThanEstimate();
    case "NotEnoughGas":
      return new NotEnoughGas(undefined, error);
    case "StellarSourceHasMultiSign":
      return new StellarSourceHasMultiSign();
    case "FeeNotLoaded":
      return new FeeNotLoaded();
    default:
      return undefined;
  }
}

function adaptOp<T extends AssetInfo>(backendOp: Operation<T>): Operation<T> {
  const { date } = backendOp.tx;
  const newDate = new Date(date);

  return {
    ...backendOp,
    value: BigInt(backendOp.value),
    tx: { ...backendOp.tx, fees: BigInt(backendOp.tx.fees), date: newDate },
  };
}

const ALPACA_URL = "http://127.0.0.1:3000/v1";

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
        rawTransaction: tx,
        signature: signature,
        pubkey: pubKey,
      },
    });
    return data.signedTransaction;
  };

const buildEstimateFees = networkFamily =>
  async function estimateFees(intent: TransactionIntent<any, any>): Promise<FeeEstimation> {
    const { data } = await network<FeeEstimation, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/estimate`,
      data: {
        intent: serializeTransactionIntent(intent),
      },
    });
    return {
      value: BigInt(data.value),
      parameters: {
        ...(typeof data.parameters?.gasPrice === "string"
          ? { gasPrice: BigInt(data.parameters.gasPrice) }
          : {}),
        ...(typeof data.parameters?.gasLimit === "string"
          ? { gasLimit: BigInt(data.parameters.gasLimit) }
          : {}),
        ...(typeof data.parameters?.maxFeePerGas === "string"
          ? { maxFeePerGas: BigInt(data.parameters.maxFeePerGas) }
          : {}),
        ...(typeof data.parameters?.maxPriorityFeePerGas === "string"
          ? { maxPriorityFeePerGas: BigInt(data.parameters.maxPriorityFeePerGas) }
          : {}),
        ...(typeof data.parameters?.additionalFees === "string"
          ? { additionalFees: BigInt(data.parameters.additionalFees) }
          : {}),
        ...(typeof data.parameters?.storageLimit === "string"
          ? { storageLimit: BigInt(data.parameters.storageLimit) }
          : {}),
      },
    };
  };

const buildValidateIntent = networkFamily =>
  async function validateIntent(
    transaction: TransactionIntent<any, any>,
    customFees?: FeeEstimation,
  ): Promise<TransactionValidation> {
    const feesParameters = {
      ...(typeof customFees?.parameters?.gasLimit === "bigint"
        ? { gasLimit: customFees?.parameters?.gasLimit.toString() }
        : {}),
      ...(typeof customFees?.parameters?.gasPrice === "bigint"
        ? { gasPrice: customFees?.parameters?.gasPrice.toString() }
        : {}),
      ...(typeof customFees?.parameters?.maxFeePerGas === "bigint"
        ? { maxFeePerGas: customFees?.parameters?.maxFeePerGas.toString() }
        : {}),
      ...(typeof customFees?.parameters?.maxPriorityFeePerGas === "bigint"
        ? { maxPriorityFeePerGas: customFees?.parameters?.maxPriorityFeePerGas.toString() }
        : {}),
      ...(typeof customFees?.parameters?.additionalFees === "bigint"
        ? { additionalFees: customFees?.parameters?.additionalFees.toString() }
        : {}),
    };

    const { data } = await network<
      {
        errors: Record<string, SerializedError>;
        warnings: Record<string, SerializedError>;
        estimatedFees: string;
        amount: string;
        totalSpent: string;
        totalFees?: string;
      },
      unknown
    >({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/validate`,
      data: {
        intent: serializeTransactionIntent(transaction),
        customFees: { value: customFees?.value.toString(), parameters: feesParameters },
      },
    });
    const errors = Object.fromEntries(
      Object.entries(data.errors)
        .map(([key, value]) => [key, deserializeError(value)] as [string, Error])
        .filter(Boolean),
    );
    const warnings = Object.fromEntries(
      Object.entries(data.warnings)
        .map(([key, value]) => [key, deserializeError(value)] as [string, Error])
        .filter(Boolean),
    );
    return {
      errors,
      warnings,
      estimatedFees: BigInt(data.estimatedFees),
      totalSpent: BigInt(data.totalSpent),
      amount: BigInt(data.amount),
      ...(data.totalFees ? { totalFees: BigInt(data.totalFees) } : {}),
    };
  };

const buildGetBalance = (networkFamily: string) =>
  async function getBalance(address: string): Promise<Balance[]> {
    const { data } = await network<Balance[], unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/balance`,
    });

    return data.map(balance => ({
      value: BigInt(balance.value),
      asset: balance.asset,
      locked: BigInt(balance?.locked ?? "0"),
    }));
  };

const buildGetSequence = (networkFamily: string) =>
  async function getSequence(address: string): Promise<bigint> {
    const { data } = await network<{ sequence: string }, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/info`,
    });

    return BigInt(data.sequence);
  };

const buildListOperations = networkFamily =>
  async function listOperations(
    address: string,
    pagination: Pagination = { minHeight: 0, order: "asc" },
  ): Promise<[Operation<any>[], string]> {
    const { data } = await network<{ items: Operation<any>[]; next: string }, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/account/${address}/operations?order=${pagination.order}&minHeight=${pagination.minHeight}`,
    });
    return [data.items.map(op => adaptOp(op)), data.next];
  };

const buildLastBlock = networkFamily =>
  async function lastBlock(): Promise<BlockInfo> {
    const { data } = await network<any, unknown>({
      method: "GET",
      url: `${ALPACA_URL}/${networkFamily}/last_block`,
    });
    return {
      height: data.height,
      time: new Date(data.time),
      hash: data.hash,
    };
  };

const buildCraftTransaction = networkFamily =>
  async function craftTransaction(
    intent: TransactionIntent<any>,
    customFees?: FeeEstimation,
  ): Promise<CraftedTransaction> {
    const feesParameters = {
      ...(typeof customFees?.parameters?.gasLimit === "bigint"
        ? { gasLimit: customFees?.parameters?.gasLimit.toString() }
        : {}),
      ...(typeof customFees?.parameters?.gasPrice === "bigint"
        ? { gasPrice: customFees?.parameters?.gasPrice.toString() }
        : {}),
      ...(typeof customFees?.parameters?.maxFeePerGas === "bigint"
        ? { maxFeePerGas: customFees?.parameters?.maxFeePerGas.toString() }
        : {}),
      ...(typeof customFees?.parameters?.maxPriorityFeePerGas === "bigint"
        ? { maxPriorityFeePerGas: customFees?.parameters?.maxPriorityFeePerGas.toString() }
        : {}),
      ...(typeof customFees?.parameters?.additionalFees === "bigint"
        ? { additionalFees: customFees?.parameters?.additionalFees.toString() }
        : {}),
    };
    const { data } = await network<CraftedTransaction, unknown>({
      method: "POST",
      url: `${ALPACA_URL}/${networkFamily}/transaction/encode`,
      data: {
        intent: serializeTransactionIntent(intent),
        customFees: { value: customFees?.value.toString(), parameters: feesParameters },
      },
    });
    return data;
  };

export const getNetworkAlpacaApi = (networkFamily: string) =>
  ({
    broadcast: buildBroadcast(networkFamily),
    combine: buildCombine(networkFamily),
    validateIntent: buildValidateIntent(networkFamily),
    estimateFees: buildEstimateFees(networkFamily),
    getBalance: buildGetBalance(networkFamily),
    getSequence: buildGetSequence(networkFamily),
    listOperations: buildListOperations(networkFamily),
    lastBlock: buildLastBlock(networkFamily),
    craftTransaction: buildCraftTransaction(networkFamily),
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
  }) satisfies Api<any>;
