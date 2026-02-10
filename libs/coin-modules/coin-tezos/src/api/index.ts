import {
  type Balance,
  Block,
  BlockInfo,
  Cursor,
  ListOperationsOptions,
  Page,
  Validator,
  IncorrectTypeError,
  type Operation,
  Reward,
  Stake,
  CraftedTransaction,
} from "@ledgerhq/coin-framework/api/index";
import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { RecommendUndelegation } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { getRevealFee } from "@taquito/taquito";
import { validatePublicKey, ValidationResult, getPkhfromPk } from "@taquito/utils";
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
import { CoreAccountInfo, CoreTransactionInfo, EstimatedFees } from "../logic/estimateFees";
import { getTezosToolkit } from "../logic/tezosToolkit";
import api from "../network/tzkt";
import {
  DUST_MARGIN_MUTEZ,
  hasEmptyBalance,
  mapIntentTypeToTezosMode,
  normalizePublicKeyForAddress,
} from "../utils";
import type { TezosApi, TezosFeeEstimation } from "./types";

export function createApi(config: TezosConfig): TezosApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: estimate,
    getBalance: balance,
    lastBlock,
    listOperations: operations,
    getStakes,
    validateIntent,
    // required by signer to compute next valid sequence/counter
    getSequence: async (address: string) => {
      const accountInfo = await api.getAccountByAddress(address);
      return accountInfo.type === "user" ? BigInt(accountInfo.counter + 1) : 0n;
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
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
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

  const feesConfig = coinConfig.getCoinConfig().fees;
  const revealFeeForSplit = needsReveal
    ? Math.max(feesConfig.minFees ?? 0, getRevealFee(transactionIntent.sender))
    : 0;

  let txFee: number;
  if (customFees) {
    txFee = needsReveal ? Math.max(totalFee - revealFeeForSplit, 0) : totalFee;
  } else if (estimation.parameters?.txFee !== undefined) {
    txFee = Number(estimation.parameters.txFee);
  } else {
    txFee = needsReveal ? Math.max(totalFee - revealFeeForSplit, 0) : totalFee;
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
          let isPublicKeyValid = false;
          try {
            const derived = getPkhfromPk(pk);
            isPublicKeyValid = derived === transactionIntent.sender;
          } catch {
            // getPkhfromPk failed = will fallback to basic validation below
            isPublicKeyValid = false;
          }

          if (!isPublicKeyValid) {
            // If derivation failed/doesn't match, check if the key is atleast valid format
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
  const config = coinConfig.getCoinConfig();
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

  const accountBase: CoreAccountInfo = {
    address: transactionIntent.sender,
    revealed: senderAccountInfo.revealed,
    balance: BigInt(senderAccountInfo.balance),
  };

  const transaction: CoreTransactionInfo = {
    mode: mapIntentTypeToTezosMode(transactionIntent.type),
    recipient: transactionIntent.recipient,
    amount: transactionIntent.amount,
    useAllAmount: !!transactionIntent.useAllAmount,
  };

  async function logicEstimate(xpub?: string): Promise<EstimatedFees> {
    // needed by the compiler (it can assume it's a "user" account with respective fields)
    if (senderAccountInfo.type !== "user") throw new Error("unexpected account type");
    const account = xpub ? { ...accountBase, xpub } : accountBase;
    return await estimateFees({ account, transaction });
  }
  const xpub = transactionIntent.senderPublicKey ?? senderAccountInfo.publicKey;

  try {
    // try intent public key first and fallback to tzkt public key
    let estimation;
    try {
      estimation = await logicEstimate(xpub);
    } catch (error) {
      // for some unknown reason, on some address the estimation fails with that error:
      // {"kind":"permanent","id":"proto.023-PtSeouLo.contract.manager.inconsistent_hash","public_key":"sppk7aMmdpDZc9KHjJBWac53NVoK4kfYbTC39EbmEzpZizjENonbHQD","expected_hash":"tz2BHzkaizWwCmhYswwTQCycgT8mXFH8QTL5","provided_hash":"tz2R3ynJBBzFZYtbx1Ywmvd8n6z2ZH3rXAQ6"}
      // it's not clear why this happens, it couldn't be further investigated
      // so we fallback to make an estimation without the public key
      // there is a test that covers this, see "fallback to an estimation without the public key" index-mainnet.integ.test.ts
      log("estimate-error", "error estimating fees, trying without pubkey", { error });
      estimation = await logicEstimate();
    }

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
      const apiAccount = await api.getAccountByAddress(transactionIntent.recipient);
      const storageLimit =
        !hasEmptyBalance(apiAccount) || transactionIntent.type === "stake" ? 0n : 277n;

      // Check if account needs reveal for proper fee calculation
      const senderApiAcc = await api.getAccountByAddress(transactionIntent.sender);
      const needsReveal = senderApiAcc.type === "user" && !senderApiAcc.revealed;

      // Production-calibrated fallback fee when Taquito estimation fails (~388 mutez observed)
      const DEFAULT_TX_FEE_FALLBACK = 388;
      let baseTxFee: bigint;

      try {
        const toolkit = getTezosToolkit();
        const simpleEstimate = await toolkit.estimate.transfer({
          to: transactionIntent.recipient,
          amount: Number(transactionIntent.amount),
          mutez: true,
          source: transactionIntent.sender,
        });
        // Use Taquito estimation, respecting minFees from config
        baseTxFee = BigInt(Math.max(config.fees.minFees, simpleEstimate.suggestedFeeMutez));
      } catch {
        // Fallback to production-calibrated default if estimation fails
        baseTxFee = BigInt(Math.max(DEFAULT_TX_FEE_FALLBACK, config.fees.minFees));
      }

      const revealFee = needsReveal
        ? BigInt(Math.max(config.fees.minFees ?? 0, getRevealFee(transactionIntent.sender)))
        : 0n;
      const totalFee = baseTxFee + revealFee;

      return {
        value: totalFee,
        parameters: {
          gasLimit: 10000n,
          storageLimit,
          amount: 0n,
          txFee: baseTxFee,
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
  { minHeight = 0, cursor, order = "asc" }: ListOperationsOptions,
): Promise<Page<Operation>> {
  const [items, newNextCursor] = await listOperations(address, {
    limit: 200,
    token: cursor,
    sort: order === "asc" ? "Ascending" : "Descending",
    minHeight: minHeight,
  });

  return { items, next: newNextCursor || undefined };
}
