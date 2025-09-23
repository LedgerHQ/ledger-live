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
  CraftedTransaction,
} from "@ledgerhq/coin-framework/api/index";
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
  validateIntent,
  getStakes,
} from "../logic";
import api from "../network/tzkt";
import type { TezosApi, TezosFeeEstimation } from "./types";
import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { RecommendUndelegation } from "@ledgerhq/errors";
import { validatePublicKey, ValidationResult, getPkhfromPk } from "@taquito/utils";
import { getRevealFee } from "@taquito/taquito";
import {
  DUST_MARGIN_MUTEZ,
  mapIntentTypeToTezosMode,
  normalizePublicKeyForAddress,
} from "../utils";

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
    getStakes,
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
): Promise<CraftedTransaction> {
  if (!isTezosTransactionType(transactionIntent.type)) {
    throw new IncorrectTypeError(transactionIntent.type);
  }

  // Always estimate to get gasLimit/storageLimit
  const estimation = await estimate(transactionIntent);
  const fee = {
    fees: (customFees?.value ?? estimation.value).toString(),
    gasLimit: estimation.parameters?.gasLimit?.toString(),
    storageLimit: estimation.parameters?.storageLimit?.toString(),
  };

  // Map generic staking intents to tezos modes
  const mappedType = mapIntentTypeToTezosMode(transactionIntent.type);

  // Guard: send max is incompatible with delegated accounts
  let amountToUse = transactionIntent.amount;
  if (mappedType === "send" && transactionIntent.useAllAmount) {
    const senderInfo = await api.getAccountByAddress(transactionIntent.sender);
    if (senderInfo.type === "user" && senderInfo.delegate?.address) {
      throw new RecommendUndelegation();
    }
    if (senderInfo.type === "user") {
      // Use the amount calculated by the estimation which includes proper buffers and adjustments
      if (estimation.parameters?.amount !== undefined) {
        amountToUse = estimation.parameters.amount;
      } else {
        // Fallback to the original calculation if estimation doesn't provide amount
        const bal = BigInt(senderInfo.balance);
        const feeBI = BigInt(fee.fees || "0");
        const dustMargin = BigInt(DUST_MARGIN_MUTEZ);
        const totalToDeduct = feeBI + dustMargin;
        amountToUse = bal > totalToDeduct ? bal - totalToDeduct : 0n;
      }
    } else {
      amountToUse = 0n;
    }
  }

  const accountForCraft = {
    address: transactionIntent.sender,
  };
  const senderApiAcc = await api.getAccountByAddress(transactionIntent.sender);
  const needsReveal = senderApiAcc.type === "user" && !senderApiAcc.revealed;
  const totalFee = Number(fee.fees || "0");

  let txFee: number;
  if (customFees) {
    txFee = totalFee;
  } else if (estimation.parameters?.txFee !== undefined) {
    txFee = Number(estimation.parameters.txFee);
  } else {
    txFee = needsReveal ? Math.max(totalFee - getRevealFee(transactionIntent.sender), 0) : totalFee;
  }

  const txForCraft = {
    type: mappedType,
    recipient: transactionIntent.recipient,
    amount: amountToUse,
    fee: { ...fee, fees: txFee.toString() },
  };
  const publicKeyForCraft =
    needsReveal && transactionIntent.senderPublicKey
      ? (() => {
          // Accept either base58 or hex from device, and map curve using sender address
          let pk = transactionIntent.senderPublicKey;
          if (validatePublicKey(pk) !== ValidationResult.VALID) {
            pk = normalizePublicKeyForAddress(pk, transactionIntent.sender) || pk;
          }
          // Verify the public key matches the sender address to avoid inconsistent_hash
          try {
            const derived = getPkhfromPk(pk);
            if (derived !== transactionIntent.sender) {
              throw new Error("public key does not match sender");
            }
          } catch {
            // If verification fails, fallback to normalization again (ensuring base58) or throw
            if (validatePublicKey(pk) !== ValidationResult.VALID) {
              throw new Error("Unable to normalize sender public key");
            }
          }
          return { publicKey: pk, publicKeyHash: transactionIntent.sender };
        })()
      : undefined;
  const { contents } = await craftTransaction(accountForCraft, txForCraft, publicKeyForCraft);
  const tx = await rawEncode(contents);
  return { transaction: tx };
}

async function estimate(transactionIntent: TransactionIntent): Promise<TezosFeeEstimation> {
  // avoid taquito error when estimating a 0-amount transfer during input
  if (
    transactionIntent.type === "send" &&
    transactionIntent.amount === 0n &&
    !transactionIntent.useAllAmount
  ) {
    return {
      value: BigInt(DUST_MARGIN_MUTEZ),
      parameters: {
        gasLimit: 10000n,
        storageLimit: 300n,
        amount: 0n,
        txFee: BigInt(DUST_MARGIN_MUTEZ),
      },
    };
  }
  const senderAccountInfo = await api.getAccountByAddress(transactionIntent.sender);
  // If the sender is not a user account, return default estimation values
  if (senderAccountInfo.type !== "user") {
    return {
      value: BigInt(DUST_MARGIN_MUTEZ),
      parameters: {
        gasLimit: 10000n,
        storageLimit: 300n,
        amount: 0n,
        txFee: BigInt(DUST_MARGIN_MUTEZ),
      },
    };
  }

  try {
    const estimation = await estimateFees({
      account: {
        address: transactionIntent.sender,
        revealed: senderAccountInfo.revealed,
        balance: BigInt(senderAccountInfo.balance),
        // try intent public key first and fallback to tzkt public key
        xpub: transactionIntent.senderPublicKey ?? senderAccountInfo.publicKey,
      },
      transaction: {
        // reuse the same mapping as craft
        mode: mapIntentTypeToTezosMode(transactionIntent.type),
        recipient: transactionIntent.recipient,
        amount: transactionIntent.amount,
        // legacy estimator needs this flag to pre-estimate fees
        useAllAmount: !!transactionIntent.useAllAmount,
      },
    });

    if (
      estimation.taquitoError &&
      !estimation.taquitoError.includes("delegate.unchanged") &&
      !estimation.taquitoError.includes("subtraction_underflow") &&
      !estimation.taquitoError.includes("balance_too_low")
    ) {
      throw new Error(`Fees estimation failed: ${estimation.taquitoError}`);
    }

    return {
      value: estimation.estimatedFees,
      parameters: {
        gasLimit: estimation.gasLimit,
        storageLimit: estimation.storageLimit,
        amount: estimation.amount,
        txFee: estimation.fees,
      },
    };
  } catch (error: any) {
    // Handle PublicKeyNotFoundError
    if (error?.message?.includes("Public key not found")) {
      return {
        value: 1000n, // Safe default with reveal fees (500 + 374 reveal + buffer)
        parameters: {
          gasLimit: 10000n,
          storageLimit: 300n,
          amount: 0n,
          txFee: 1000n,
        },
      };
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}

async function operations(
  address: string,
  pagination: Pagination = { minHeight: 0, order: "asc" },
): Promise<[Operation[], string]> {
  const [operations, newNextCursor] = await listOperations(address, {
    limit: 200,
    token: pagination.lastPagingToken,
    sort: pagination.order === "asc" ? "Ascending" : "Descending",
    minHeight: pagination.minHeight,
  });

  return [operations, newNextCursor || ""];
}
