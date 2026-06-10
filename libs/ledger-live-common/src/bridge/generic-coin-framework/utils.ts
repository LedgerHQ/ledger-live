import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-module-framework/utils";
import type {
  AssetInfo,
  Balance,
  Operation as CoreOperation,
  StakingOperation,
  TransactionIntent,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  FeeData,
  FeeDataRaw,
  GasOptions,
  GasOptionsRaw,
  GenericTransaction,
  GenericTransactionRaw,
  OperationCommon,
} from "./types";
import { craftTransactionData as defaultCraftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";

type BigNumberToBigIntDeep<T> = T extends BigNumber
  ? bigint
  : T extends Array<infer U>
    ? Array<BigNumberToBigIntDeep<U>>
    : T extends object
      ? { [K in keyof T]: BigNumberToBigIntDeep<Exclude<T[K], undefined>> }
      : T;

export function bigNumberToBigIntDeep<T>(obj: T): BigNumberToBigIntDeep<T> {
  if (BigNumber.isBigNumber(obj)) return BigInt(obj.toFixed()) as BigNumberToBigIntDeep<T>;

  if (Array.isArray(obj)) return obj.map(bigNumberToBigIntDeep) as BigNumberToBigIntDeep<T>;

  if (!!obj && typeof obj === "object")
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, bigNumberToBigIntDeep(value)]),
    ) as BigNumberToBigIntDeep<T>;

  return obj as BigNumberToBigIntDeep<T>;
}

export function findCryptoCurrencyByNetwork(network: string): CryptoCurrency | undefined {
  const networksRemap = {
    xrp: "ripple",
  };
  return findCryptoCurrencyById(networksRemap[network] ?? network);
}

export function extractBalance(balances: Balance[], type: string): Balance {
  return (
    balances.find(balance => balance.asset.type === type) ?? {
      asset: { type },
      value: 0n,
    }
  );
}

export function extractBalances(
  account: Account,
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo,
): Balance[] {
  const balances: Balance[] = [
    {
      // `value` is the total balance, `locked` is the non-spendable part of it.
      // Consumers must compute available funds as `value - locked`.
      value: BigInt(account.balance.toFixed()),
      asset: { type: "native" },
      locked: BigInt(BigNumber.max(account.balance.minus(account.spendableBalance), 0).toFixed()),
    },
  ];

  if (!account.subAccounts?.length || !getAssetFromToken) {
    return balances;
  }

  for (const subAccount of account.subAccounts) {
    const asset = getAssetFromToken(subAccount.token, account.freshAddress);
    balances.push({
      value: BigInt(subAccount.balance.toFixed()),
      asset,
      locked: BigInt(
        BigNumber.max(subAccount.balance.minus(subAccount.spendableBalance), 0).toFixed(),
      ),
    });
  }

  return balances;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isDelegationMode(mode: GenericTransaction["mode"]): mode is StakingOperation {
  return (
    typeof mode === "string" &&
    ["delegate", "undelegate", "redelegate", "claimReward", "compoundReward"].includes(mode)
  );
}

type GenericCoinFrameworkMemo =
  | { type: string; value?: string }
  | { type: "map"; memos: Map<string, string> };
type GenericCoinFrameworkTxData = { type: string; value?: unknown };
type GenericCoinFrameworkTransactionIntent = TransactionIntent & {
  memo?: GenericCoinFrameworkMemo;
  data?: GenericCoinFrameworkTxData;
  mode?: StakingOperation;
  valAddress?: string;
  valId?: string;
  withdrawId?: string;
  dstValAddress?: string;
};

function getDelegationIntentFields(
  delegationMode: StakingOperation | undefined,
  transaction: GenericTransaction,
): Partial<
  Pick<
    GenericCoinFrameworkTransactionIntent,
    "mode" | "valAddress" | "valId" | "dstValAddress" | "withdrawId"
  >
> {
  return {
    ...(delegationMode !== undefined && transaction.valAddress
      ? { mode: delegationMode, valAddress: transaction.valAddress }
      : {}),
    ...(delegationMode !== undefined && transaction.valId
      ? { mode: delegationMode, valId: transaction.valId }
      : {}),
    ...(delegationMode !== undefined && transaction.dstValAddress
      ? { dstValAddress: transaction.dstValAddress }
      : {}),
  };
}

export function cleanedOperation(operation: OperationCommon): OperationCommon {
  if (!operation.extra) return operation;

  const extraToClean = new Set([
    "assetReference",
    "assetAmount",
    "assetOwner",
    "assetSenders",
    "assetRecipients",
    "parentSenders",
    "parentRecipients",
    "ledgerOpType",
  ]);
  const cleanedExtra = Object.fromEntries(
    Object.entries(operation.extra).filter(([key]) => !extraToClean.has(key)),
  );

  return { ...operation, extra: cleanedExtra };
}

export function adaptCoreOperationToLiveOperation(accountId: string, op: CoreOperation): Operation {
  const opType = op.type as OperationType;

  const extra: {
    assetReference?: string;
    assetOwner?: string;
    assetAmount?: string | undefined;
    assetSenders?: string[];
    assetRecipients?: string[];
    parentSenders?: string[];
    parentRecipients?: string[];
    ledgerOpType?: string | undefined;
    memo?: string | undefined;
    internal?: boolean;
    feePayer?: string;
    stake?: { address: string; amount: BigNumber };
  } = {};

  if (op.details?.ledgerOpType !== undefined) {
    extra.ledgerOpType = op.details.ledgerOpType as string;
  }

  if (op.details?.assetAmount !== undefined) {
    extra.assetAmount = op.details.assetAmount as string;
  }

  if (isStringArray(op.details?.assetSenders)) {
    extra.assetSenders = op.details?.assetSenders;
  }

  if (isStringArray(op.details?.assetRecipients)) {
    extra.assetRecipients = op.details?.assetRecipients;
  }

  if (isStringArray(op.details?.parentSenders)) {
    extra.parentSenders = op.details?.parentSenders;
  }

  if (isStringArray(op.details?.parentRecipients)) {
    extra.parentRecipients = op.details?.parentRecipients;
  }

  if (op.asset?.type !== "native") {
    extra.assetReference =
      "assetReference" in (op.asset ?? {}) ? (op.asset as any).assetReference : "";
    extra.assetOwner = "assetOwner" in (op.asset ?? {}) ? (op.asset as any).assetOwner : "";
  }
  if (op.details?.memo) {
    extra.memo = op.details.memo as string;
  }

  if (op.details?.internal === true) {
    extra.internal = op.details?.internal;
  }

  if (typeof op.tx.feesPayer === "string") {
    extra.feePayer = op.tx.feesPayer;
  }

  if (op.details?.stake && typeof op.details.stake === "object") {
    const s = op.details.stake as { address?: string; amount?: bigint };
    extra.stake = {
      address: s.address ?? "",
      amount: new BigNumber(s.amount !== undefined ? String(s.amount) : "0"),
    };
  }

  const bnFees = new BigNumber(op.tx.fees.toString());
  const hasFailed = op.tx.failed;

  let value: BigNumber;
  if (hasFailed) {
    value = bnFees;
  } else if (
    op.asset.type === "native" &&
    ["OUT", "FEES", "DELEGATE", "UNDELEGATE", "REDELEGATE"].includes(opType)
  ) {
    value = new BigNumber(op.value.toString()).plus(bnFees);
  } else {
    value = new BigNumber(op.value.toString());
  }

  const res = {
    id: encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: opType,
    value,
    fee: bnFees,
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: extra.parentSenders ?? op.senders,
    recipients: extra.parentRecipients ?? op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence
      ? new BigNumber(op.details?.sequence.toString())
      : undefined,
    hasFailed,
    extra,
  };

  return res;
}

/**
 * Default implementation of `computeIntentType` is a simple whitelist
 * with a fallback to "Payment"
 */
function defaultComputeIntentType(transaction: GenericTransaction): string {
  if (!transaction.mode) return "Payment"; // NOTE: assuming payment by default here, can be changed based on transaction.mode

  const modeRemap = {
    delegate: "stake",
    undelegate: "unstake",
  };
  const mode = modeRemap[transaction.mode] ?? transaction.mode;

  if (
    [
      "changeTrust",
      "send",
      "send-legacy",
      "send-eip1559",
      "stake",
      "unstake",
      "finalize_unstake",
    ].includes(mode)
  )
    return mode;

  throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
}

/**
 * Converts a transaction object into a `TransactionIntent` object, which is used to represent
 * the intent of a transaction in a standardized format.
 *
 * @template MemoType - The type of memo supported by the transaction, defaults to `MemoNotSupported`.
 *
 * @param account - The account initiating the transaction. Contains details such as the sender's address.
 * @param transaction - The transaction object containing details about the operation to be performed.
 *   - `assetOwner` (optional): The issuer of the asset, if applicable.
 *   - `assetReference` (optional): The code of the asset, if applicable.
 *   - `mode` (optional): The mode of the transaction, e.g., "changetrust" or "send".
 *   - `fees` (optional): The fees associated with the transaction.
 *   - `memoType` (optional): The type of memo to attach to the transaction.
 *   - `memoValue` (optional): The value of the memo to attach to the transaction.
 * @param computeIntentType - An optional function to compute the intent type that supersedes the default implementation if present
 *
 * @returns A `TransactionIntent` object containing the standardized representation of the transaction.
 *   - Includes details such as type, sender, recipient, amount, fees, asset, and an optional memo.
 *   - If `assetReference` and `assetOwner` are provided, the asset is represented as a token.
 *   - If `memoType` and `memoValue` are provided, a memo is included; otherwise, a default memo of type "NO_MEMO" is added.
 *
 * @throws An error if the transaction mode is unsupported.
 */
export function transactionToIntent(
  account: Account,
  transaction: GenericTransaction,
  computeIntentType?: (transaction: GenericTransaction) => string,
  craftTransactionData?: (intent: TransactionIntent) => TxData,
): GenericCoinFrameworkTransactionIntent {
  const intentType = (computeIntentType ?? defaultComputeIntentType)(transaction);
  const isStaking = ["stake", "unstake", "finalize_unstake"].includes(intentType);
  const delegationMode = isDelegationMode(transaction.mode) ? transaction.mode : undefined;
  const isDelegation = delegationMode !== undefined;
  const amount = fromBigNumberToBigInt(transaction.amount, 0n);
  const useAllAmount = !!transaction.useAllAmount;
  const res: GenericCoinFrameworkTransactionIntent = {
    intentType: isStaking || isDelegation ? "staking" : "transaction",
    type: intentType,
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount,
    asset: { type: "native", name: account.currency.name, unit: account.currency.units[0] },
    useAllAmount,
    feesStrategy: transaction.feesStrategy ?? undefined,
    sequence:
      transaction.nonce !== null && transaction.nonce !== undefined
        ? BigInt(transaction.nonce.toString())
        : undefined,
    sponsored: transaction.sponsored,
    ...getDelegationIntentFields(delegationMode, transaction),
  };
  if (transaction.assetReference && transaction.assetOwner) {
    const { subAccountId } = transaction;
    const { subAccounts } = account;

    const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;

    res.asset = {
      type: tokenAccount?.token.tokenType ?? "token",
      assetReference: transaction.assetReference,
      name: tokenAccount?.token.name ?? transaction.assetReference, // NOTE: for stellar, assetReference = tokenAccount.name, this is futureproofing
      unit: account.currency.units[0],
      assetOwner: transaction.assetOwner,
    };
  }

  if (typeof transaction.tag === "number") {
    res.memo = {
      type: "map",
      memos: new Map([["destinationTag", String(transaction.tag)]]),
    };
  } else if (transaction.memoType && transaction.memoValue) {
    res.memo = {
      type: transaction.memoType,
      value: transaction.memoValue,
    };
  } else {
    res.memo = { type: "NO_MEMO" };
  }

  if (!transaction.data || transaction.data.length === 0) {
    const resolvedCraftTransactionData = craftTransactionData ?? defaultCraftTransactionData;
    res.data = resolvedCraftTransactionData(res);
  } else {
    // We assume that if the transaction data is a buffer, the intent expect a buffer too
    res.data = { type: "buffer", value: transaction.data };
  }

  return res;
}

function toFeeDataRaw(data: FeeData): FeeDataRaw {
  return {
    gasPrice: data.gasPrice?.toFixed() ?? null,
    maxFeePerGas: data.maxFeePerGas?.toFixed() ?? null,
    maxPriorityFeePerGas: data.maxPriorityFeePerGas?.toFixed() ?? null,
    nextBaseFee: data.nextBaseFee?.toFixed() ?? null,
  };
}

function toGasOptionRaw(options: GasOptions): GasOptionsRaw {
  return {
    fast: toFeeDataRaw(options.fast),
    medium: toFeeDataRaw(options.medium),
    slow: toFeeDataRaw(options.slow),
  };
}

function toGenericTransactionRaw(transaction: GenericTransaction): GenericTransactionRaw {
  const raw: GenericTransactionRaw = {
    amount: transaction.amount.toString(),
    recipient: transaction.recipient,
    family: transaction.family,
  };

  const booleanFieldsToPropagate = ["useAllAmount", "sponsored"] as const;
  for (const field of booleanFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const stringFieldsToPropagate = [
    "memoType",
    "memoValue",
    "assetReference",
    "assetOwner",
  ] as const;
  for (const field of stringFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const numberFieldsToPropagate = ["tag", "type", "chainId"] as const;
  for (const field of numberFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const bigNumberFieldsToPropagate = [
    "fees",
    "storageLimit",
    "nonce",
    "gasLimit",
    "gasPrice",
    "maxFeePerGas",
    "maxPriorityFeePerGas",
    "additionalFees",
  ] as const;
  for (const field of bigNumberFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field]?.toFixed();
    }
  }

  if ("customFees" in transaction) {
    raw.customFees =
      transaction.customFees && "fees" in transaction.customFees.parameters
        ? {
            parameters: { fees: transaction.customFees.parameters.fees?.toFixed() },
          }
        : { parameters: {} };
  }

  if ("feesStrategy" in transaction) {
    raw.feesStrategy = transaction.feesStrategy;
  }

  if ("mode" in transaction) {
    raw.mode = transaction.mode;
  }

  if ("data" in transaction) {
    raw.data = transaction.data?.toString("hex");
  }

  if ("networkInfo" in transaction) {
    raw.networkInfo = transaction.networkInfo && {
      fees: transaction.networkInfo.fees.toFixed(),
    };
  }

  if ("gasOptions" in transaction) {
    raw.gasOptions = transaction.gasOptions && toGasOptionRaw(transaction.gasOptions);
  }

  if ("recipientDomain" in transaction) {
    raw.recipientDomain = transaction.recipientDomain;
  }

  if (transaction.valAddress) {
    raw.valAddress = transaction.valAddress;
  }
  if (transaction.valId) {
    raw.valId = transaction.valId;
  }
  if (transaction.dstValAddress) {
    raw.dstValAddress = transaction.dstValAddress;
  }

  return raw;
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: GenericTransaction,
  sequenceNumber?: bigint,
): Operation => {
  let type: OperationType;
  switch (transaction.mode) {
    case "changeTrust":
      type = "OPT_IN";
      break;
    case "delegate":
    case "redelegate":
      type = "DELEGATE";
      break;
    case "undelegate":
      type = "UNDELEGATE";
      break;
    case "stake":
      type = "STAKE";
      break;
    case "unstake":
      type = "UNSTAKE";
      break;
    case "finalize_unstake":
      type = "FINALIZE_UNSTAKE";
      break;
    case "claimReward":
    case "compoundReward":
      type = "REWARD";
      break;
    default:
      type = "OUT";
      break;
  }
  const fees = BigInt(transaction.fees?.toString() || "0");
  const { subAccountId } = transaction;
  const { subAccounts } = account;
  const parentType = subAccountId ? "FEES" : type;
  const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;
  const normalizedSequenceNumber = String(sequenceNumber ?? 0);
  const nonce = sequenceNumber === undefined ? undefined : new BigNumber(normalizedSequenceNumber);

  const operation: Operation = {
    id: encodeOperationId(account.id, "", parentType),
    hash: "",
    type: parentType,
    value: subAccountId ? new BigNumber(fees.toString()) : transaction.amount, // match old behavior
    fee: new BigNumber(fees.toString()),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    transactionSequenceNumber: new BigNumber(normalizedSequenceNumber),
    accountId: account.id,
    date: new Date(),
    transactionRaw: toGenericTransactionRaw({
      ...transaction,
      nonce,
      ...(tokenAccount
        ? { recipient: tokenAccount.token.contractAddress, amount: new BigNumber(0) }
        : {}),
    }),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--${type}`,
        hash: "",
        type,
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(fees.toString()),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        transactionSequenceNumber: new BigNumber(normalizedSequenceNumber),
        accountId: subAccountId,
        date: new Date(),
        transactionRaw: toGenericTransactionRaw({
          ...transaction,
          nonce,
        }),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }
  return operation;
};
