import {
  type Balance,
  Block,
  BlockInfo,
  Cursor,
  Page,
  IncorrectTypeError,
  type Operation,
  type Pagination,
  Reward,
  Stake,
} from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
  rawEncode,
} from "../logic";
import api from "../network/tzkt";
import type { TezosApi, TezosFeeEstimation } from "./types";
import { FeeEstimation, TransactionIntent, TransactionValidation } from "@ledgerhq/coin-framework/api/types";
import { TezosOperationMode } from "../types";
import { validateAddress, ValidationResult } from "@taquito/utils";
import { InvalidAddress, RecipientRequired, RecommendUndelegation } from "@ledgerhq/errors";
import { DerivationType } from "@taquito/ledger-signer";
import { b58cencode, Prefix, prefix } from "@taquito/utils";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { DEFAULT_FEE } from "@taquito/taquito";

export function createApi(config: TezosConfig): TezosApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance: balance,
    lastBlock,
    listOperations: operations,
    getStakes: stakes,
    validateIntent,
    // required by signer to compute next valid sequence/counter
    getSequence: async (address: string) => {
      const accountInfo = await api.getAccountByAddress(address);
      return accountInfo.type === "user" ? accountInfo.counter + 1 : 0;
    },
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
  };
}

function isTezosTransactionType(
  type: string,
): type is "send" | "delegate" | "undelegate" | "stake" | "unstake" {
  return ["send", "delegate", "undelegate", "stake", "unstake"].includes(type);
}

async function stakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  // tezos exposes a single staking position via delegation when a delegate is set
  const accountInfo = await api.getAccountByAddress(address);
  if (accountInfo.type !== "user") return { items: [] };
  if (!accountInfo.delegate?.address) return { items: [] };
  return {
    items: [
      {
        uid: address,
        address,
        delegate: accountInfo.delegate.address,
        state: "active",
        asset: { type: "native" },
        amount: BigInt(accountInfo.balance ?? 0),
      },
    ],
  };
}

async function balance(address: string): Promise<Balance[]> {
  const value = await getBalance(address);
  const accountInfo = await api.getAccountByAddress(address);
  // tzkt returns `type: "empty"` for untouched accounts; legacy logic returns -1 in that case
  // the generic bridge expects non-negative balances
  const normalized = value < 0n ? 0n : value;
  // include stake information so ui can reflect delegation on account page
  const stake: Stake | undefined =
    accountInfo.type === "user" && accountInfo.delegate?.address
      ? {
          uid: address,
          address,
          delegate: accountInfo.delegate.address,
          state: "active",
          asset: { type: "native" },
          amount: BigInt(accountInfo.balance ?? 0),
        }
      : undefined;
  return [
    {
      value: normalized,
      asset: { type: "native" },
      stake,
    },
  ];
}

async function craft(
  transactionIntent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<string> {
  if (!isTezosTransactionType(transactionIntent.type)) {
    throw new IncorrectTypeError(transactionIntent.type);
  }

  // note that an estimation is always necessary to get gasLimit and storageLimit, if even using custom fees
  const fee = await estimate(transactionIntent).then(fees => ({
    fees: (customFees?.value ?? fees.value).toString(),
    gasLimit: fees.parameters?.gasLimit?.toString(),
    storageLimit: fees.parameters?.storageLimit?.toString(),
  }));

  // map generic staking intents to deal with tezos operation modes (delegate/undelegate)
  const mappedType =
    transactionIntent.type === "stake"
      ? "delegate"
      : transactionIntent.type === "unstake"
      ? "undelegate"
      : (transactionIntent.type as "send" | "delegate" | "undelegate");

  // guard: send max is incompatible with delegated accounts
  if (
    mappedType === "send" &&
    transactionIntent.useAllAmount
  ) {
    const senderInfo = await api.getAccountByAddress(transactionIntent.sender);
    if (senderInfo.type === "user" && senderInfo.delegate?.address) {
      throw new RecommendUndelegation();
    }
  }

  // compute amount to use in forge
  let amountToUse = transactionIntent.amount;
  if (mappedType === "send" && transactionIntent.useAllAmount) {
    const senderInfo = await api.getAccountByAddress(transactionIntent.sender);
    if (senderInfo.type === "user") {
      const bal = BigInt(senderInfo.balance);
      const feeBI = BigInt(fee.fees || "0");
      amountToUse = bal > feeBI ? bal - feeBI : 0n;
    } else {
      amountToUse = 0n;
    }
  }

  const accountForCraft = {
    address: transactionIntent.sender,
    // craftTransaction expects the current counter, it will increment internally per content
    counter: typeof transactionIntent.sequence === "number" ? transactionIntent.sequence - 1 : undefined,
  };
  const senderApiAcc = await api.getAccountByAddress(transactionIntent.sender);
  const needsReveal = senderApiAcc.type === "user" ? senderApiAcc.revealed === false : false;
  const totalFeeBI = BigInt(fee.fees || "0");
  const txFeeBI = needsReveal ? (totalFeeBI > BigInt(DEFAULT_FEE.REVEAL) ? totalFeeBI - BigInt(DEFAULT_FEE.REVEAL) : 0n) : totalFeeBI;

  const txForCraft = {
    type: mappedType,
    recipient: transactionIntent.recipient,
    amount: amountToUse,
    fee: { ...fee, fees: txFeeBI.toString() },
  } as const;
  const publicKeyForCraft = needsReveal && transactionIntent.senderPublicKey
    ? (() => {
        let pk = transactionIntent.senderPublicKey;
        const isBase58 =
          pk.startsWith("edpk") || pk.startsWith("sppk") || pk.startsWith("p2pk") || pk.startsWith("BLpk");
        if (!isBase58) {
          pk = b58cencode(
            compressPublicKey(Buffer.from(pk, "hex"), DerivationType.ED25519),
            prefix[Prefix.EDPK],
          );
        }
        return { publicKey: pk, publicKeyHash: transactionIntent.sender };
      })()
    : undefined;
  const { contents } = await craftTransaction(accountForCraft, txForCraft, publicKeyForCraft);
  return rawEncode(contents);
}

async function estimate(transactionIntent: TransactionIntent): Promise<TezosFeeEstimation> {
  // avoid taquito error when estimating a 0-amount transfer during input
  if (
    transactionIntent.type === "send" &&
    transactionIntent.amount === 0n &&
    !transactionIntent.useAllAmount
  ) {
    return { value: 0n } as TezosFeeEstimation;
  }
  const senderAccountInfo = await api.getAccountByAddress(transactionIntent.sender);
  if (senderAccountInfo.type !== "user") throw new Error("unexpected account type");

  const {
    estimatedFees: value,
    gasLimit,
    storageLimit,
    taquitoError,
  } = await estimateFees({
    account: {
      address: transactionIntent.sender,
      revealed: senderAccountInfo.revealed,
      balance: BigInt(senderAccountInfo.balance),
      // try intent public key first and fallback to tzkt public key
      xpub: transactionIntent.senderPublicKey ?? senderAccountInfo.publicKey,
    },
    transaction: {
      // reuse the same mapping as craft, keeping generic intent at the api boundary
      mode: (transactionIntent.type === "stake"
        ? "delegate"
        : transactionIntent.type === "unstake"
        ? "undelegate"
        : transactionIntent.type) as TezosOperationMode,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      // important for send max: legacy estimator needs this flag to pre-estimate fees
      useAllAmount: !!transactionIntent.useAllAmount,
    },
  });

  // deal with taquitoError (see later what is it????)
  if (taquitoError !== undefined) {
    throw new Error(`Fees estimation failed: ${taquitoError}`);
  }

  return {
    value,
    parameters: {
      gasLimit,
      storageLimit,
    },
  };
}

type PaginationState = {
  readonly pageSize: number;
  readonly maxIterations: number; // a security to avoid infinite loop
  currentIteration: number;
  readonly minHeight: number;
  continueIterations: boolean;
  nextCursor?: string;
  accumulator: Operation[];
};

async function fetchNextPage(address: string, state: PaginationState): Promise<PaginationState> {
  const [operations, newNextCursor] = await listOperations(address, {
    limit: state.pageSize,
    token: state.nextCursor,
    sort: "Ascending",
    minHeight: state.minHeight,
  });
  const newCurrentIteration = state.currentIteration + 1;
  let continueIteration = newNextCursor !== "";
  if (newCurrentIteration >= state.maxIterations) {
    log("coin:tezos", "(api/operations): max iterations reached", state.maxIterations);
    continueIteration = false;
  }
  const accumulated = operations.concat(state.accumulator);
  return {
    ...state,
    continueIterations: continueIteration,
    currentIteration: newCurrentIteration,
    nextCursor: newNextCursor,
    accumulator: accumulated,
  };
}

async function operationsFromHeight(
  address: string,
  start: number,
): Promise<[Operation[], string]> {
  const firstState: PaginationState = {
    pageSize: 200,
    maxIterations: 10,
    currentIteration: 0,
    minHeight: start,
    continueIterations: true,
    accumulator: [],
  };

  let state = await fetchNextPage(address, firstState);
  while (state.continueIterations) {
    state = await fetchNextPage(address, state);
  }
  return [state.accumulator, state.nextCursor || ""];
}

async function operations(
  address: string,
  pagination: Pagination = { minHeight: 0 },
): Promise<[Operation[], string]> {
  return operationsFromHeight(address, pagination.minHeight);
}

async function validateIntent(intent: TransactionIntent): Promise<TransactionValidation> {
  // central place to validate amounts/fees for generic bridge
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  let estimatedFees: bigint;
  let amount: bigint;
  let totalSpent: bigint;

  // basic recipient validation for send
  if (intent.type === "send") {
    if (!intent.recipient) {
      errors.recipient = new RecipientRequired("");
      return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    }
    if (validateAddress(intent.recipient) !== ValidationResult.VALID) {
      errors.recipient = new InvalidAddress(undefined, { currencyName: "Tezos" });
      return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    }
  }

  // avoid taquito error `contract.empty_transaction` when amount is 0 during typing
  // do not short-circuit when useAllAmount is enabled (send max path)
  if (intent.type === "send" && intent.amount === 0n && !intent.useAllAmount) {
    estimatedFees = 0n;
    amount = 0n;
    totalSpent = 0n;
    return { errors, warnings, estimatedFees, amount, totalSpent };
  }

  try {
    // send max not allowed on delegated accounts (must undelegate acc first)
    if (intent.type === "send" && intent.useAllAmount) {
      const senderInfo = await api.getAccountByAddress(intent.sender);
      if (senderInfo.type === "user" && senderInfo.delegate?.address) {
        errors.amount = new RecommendUndelegation();
        return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
      }
    }

    const estimation = await estimate(intent);
    estimatedFees = estimation.value;

    if (intent.type === "stake" || intent.type === "unstake") {
      const accountInfo = await api.getAccountByAddress(intent.sender);
      amount = BigInt(accountInfo.type === "user" ? accountInfo.balance : 0);
      totalSpent = estimatedFees;
    } else if (intent.type === "send" && intent.useAllAmount) {
      // send max: amount = balance - fees (clamped to >= 0)
      const accountInfo = await api.getAccountByAddress(intent.sender);
      if (accountInfo.type === "user") {
        const bal = BigInt(accountInfo.balance);
        amount = bal > estimatedFees ? bal - estimatedFees : 0n;
        totalSpent = amount + estimatedFees;
      } else {
        amount = 0n;
        totalSpent = 0n;
      }
    } else {
      amount = intent.amount;
      totalSpent = amount + estimatedFees;
    }

    // basic sanity check on balance coverage
    const accountInfo = await api.getAccountByAddress(intent.sender);
    if (accountInfo.type === "user") {
      const accountBalance = BigInt(accountInfo.balance);
      if (totalSpent > accountBalance) {
        errors.amount = new Error("Insufficient balance");
      }
    }

  } catch (e) {
    errors.estimation = e as Error;
    estimatedFees = 0n;
    amount = intent.amount;
    totalSpent = intent.amount;
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}
