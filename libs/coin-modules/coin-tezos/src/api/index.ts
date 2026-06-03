import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CraftedTransaction,
  Cursor,
  IncorrectTypeError,
  ListOperationsOptions,
  type Operation,
  Page,
  Reward,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import type {
  CoinModuleApi,
  BalanceOptions,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { RecommendUndelegation } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { getRevealFee } from "@taquito/taquito";
import { getPkhfromPk, validatePublicKey, ValidationResult } from "@taquito/utils";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  getStakes,
  lastBlock,
  listOperations,
  rawEncode,
  validateIntent,
} from "../logic";
import { CoreAccountInfo, CoreTransactionInfo, EstimatedFees } from "../logic/estimateFees";
import { getTezosToolkit } from "../logic/tezosToolkit";
import { validateAddress } from "../logic/validateAddress";
import api from "../network/tzkt";
import {
  DUST_MARGIN_MUTEZ,
  hasEmptyBalance,
  normalizePublicKeyForAddress,
  parseTezosTokenAsset,
  resolveTezosOperationMode,
} from "../utils";
import type { TezosFeeEstimation } from "./types";
import type { TezosOperationMode } from "../types/model";

export function createApi(config: TezosConfig): CoinModuleApi {
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
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),
    lastBlock,
    listOperations: operations,
    getStakes,
    validateIntent,
    getNextSequence: async (address: string) => {
      const accountInfo = await api.getAccountByAddress(address);
      return accountInfo.type === "user" ? BigInt(accountInfo.counter + 1) : 0n;
    },
    getBlock,
    getBlockInfo,
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateAddress,
    craftTransactionData,
  };
}

function isTezosTransactionType(
  type: string,
): type is "send" | "delegate" | "undelegate" | "stake" | "unstake" | "finalize_unstake" {
  return ["send", "delegate", "undelegate", "stake", "unstake", "finalize_unstake"].includes(type);
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

  const tezosMode = resolveTezosOperationMode(transactionIntent.type, transactionIntent.asset);
  const mappedType: TezosOperationMode =
    tezosMode === "send_token" ? "send_token" : (transactionIntent.type as TezosOperationMode);
  const tokenCraftInfo =
    tezosMode === "send_token" ? parseTezosTokenAsset(transactionIntent.asset)! : undefined;

  // Guard: send max is incompatible with delegated accounts (native XTZ only)
  let amountToUse = tezosMode === "finalize_unstake" ? 0n : transactionIntent.amount;
  if (tezosMode === "send" && transactionIntent.useAllAmount) {
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
    ...(tokenCraftInfo && {
      contractAddress: tokenCraftInfo.contractAddress,
      tokenId: tokenCraftInfo.tokenId,
    }),
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
  const tezosModeForEstimate = resolveTezosOperationMode(
    transactionIntent.type,
    transactionIntent.asset,
  );
  if (
    (tezosModeForEstimate === "send" || tezosModeForEstimate === "send_token") &&
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
    stakedBalance: BigInt(senderAccountInfo.stakedBalance ?? 0),
  };

  const tokenEstimationInfo =
    tezosModeForEstimate === "send_token"
      ? parseTezosTokenAsset(transactionIntent.asset)!
      : undefined;

  const transaction: CoreTransactionInfo = {
    mode: tezosModeForEstimate,
    recipient: transactionIntent.recipient,
    amount: tezosModeForEstimate === "finalize_unstake" ? 0n : transactionIntent.amount,
    useAllAmount: !!transactionIntent.useAllAmount,
    ...(tokenEstimationInfo && {
      contractAddress: tokenEstimationInfo.contractAddress,
      tokenId: tokenEstimationInfo.tokenId,
    }),
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
      !estimation.taquitoError.includes("balance_too_low") &&
      !estimation.taquitoError.includes("script_rejected")
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

      let baseTxFee: bigint;
      let txGasLimit: bigint;

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
        txGasLimit = BigInt(simpleEstimate.gasLimit);
      } catch {
        // When estimation fails because the sender is unrevealed (PublicKeyNotFoundError),
        // fallback to a conservative gas value suitable for typical new-account XTZ transfers.
        // This buffer (~2500 gas) is more than enough for a standard transfer that actually uses ~1420 gas.
        // The fee is computed according to Taquito's calculation so it will satisfy the Tezos prefilter rule:
        //   total_fees >= ceil(100 + 0.1*total_gas + op_size)
        // We use a base of 120 instead of 100 to mimic Taquito and minimize rejected low-fee ops.
        const SAFE_FALLBACK_GAS = 2500; // covers typical new-account transfer (~1420) with buffer
        const FALLBACK_OP_SIZE_BYTES = 154; // typical forged size for a simple XTZ transfer
        txGasLimit = BigInt(SAFE_FALLBACK_GAS);
        baseTxFee = BigInt(
          Math.max(
            config.fees.minFees,
            Math.ceil(120 + 0.1 * SAFE_FALLBACK_GAS + FALLBACK_OP_SIZE_BYTES),
          ),
        );
      }

      const revealFee = needsReveal
        ? BigInt(Math.max(config.fees.minFees ?? 0, getRevealFee(transactionIntent.sender)))
        : 0n;
      const totalFee = baseTxFee + revealFee;

      return {
        value: totalFee,
        parameters: {
          gasLimit: txGasLimit,
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
  // FIXME This wrapper hard-codes limit: 200 and ignores any caller-provided limit from ListOperationsOptions. Either
  //  forward options.limit (as a soft/capped limit) or throw a "not supported" error when limit is set to match the
  //  ListOperationsOptions contract.
  const [items, newNextCursor] = await listOperations(address, {
    limit: 1000, // Increased limit to 1000 to ensure delegation information is available when displaying account details (temporary fix until proper pagination is implemented).
    token: cursor,
    sort: order === "asc" ? "Ascending" : "Descending",
    minHeight: minHeight,
  });

  return { items, next: newNextCursor || undefined };
}
