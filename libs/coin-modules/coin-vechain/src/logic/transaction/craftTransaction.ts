import { BigNumber } from "bignumber.js";
import type {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  calculateClausesVet,
  calculateClausesVtho,
  generateNonce,
  parseAddress,
} from "../../common-logic";
import { estimateGas } from "../../common-logic/estimateGas";
import { getThorClient } from "../../common-logic/getThorClient";
import { getChainTag } from "../../config";
import { getAccount, getBlockRef } from "../../network";
import type { VechainSDKTransactionBody, VechainSDKTransactionClause } from "../../types";

const EXPIRATION = 18;

type GasFeeParams = {
  gas: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
};

function isTokenAsset(intent: TransactionIntent): boolean {
  return intent.asset.type !== "native";
}

async function resolveAmount(intent: TransactionIntent, isToken: boolean): Promise<BigNumber> {
  if (!intent.useAllAmount) {
    return new BigNumber(intent.amount.toString());
  }

  const { balance, energy } = await getAccount(intent.sender);
  return new BigNumber((isToken ? energy : balance) || "0");
}

async function resolveGasFees(
  clauses: VechainSDKTransactionClause[],
  sender: string,
  customFees?: FeeEstimation,
): Promise<GasFeeParams> {
  const custom = customFees?.parameters as Partial<GasFeeParams> | undefined;

  // Fast path: a full override covers every field, so skip the network round trip entirely.
  if (
    custom?.gas !== undefined &&
    custom.maxFeePerGas !== undefined &&
    custom.maxPriorityFeePerGas !== undefined
  ) {
    return {
      gas: Number(custom.gas),
      maxFeePerGas: Number(custom.maxFeePerGas),
      maxPriorityFeePerGas: Number(custom.maxPriorityFeePerGas),
    };
  }

  const gasResult = await estimateGas(clauses, sender);
  const thorClient = getThorClient();
  const body = await thorClient.transactions.buildTransactionBody(clauses, gasResult.totalGas, {});

  // Partial override: apply each provided field individually over the estimate, so e.g. a
  // gas-only override is honoured instead of being discarded by an all-or-nothing check. Coerce
  // every field to a JS number: the generic coin-framework hands fee parameters back as bigint,
  // and a bigint here reaches `JSON.stringify(body)` below, which cannot serialize it.
  return {
    gas: Number(custom?.gas ?? gasResult.totalGas),
    maxFeePerGas: Number(custom?.maxFeePerGas ?? body.maxFeePerGas ?? "0"),
    maxPriorityFeePerGas: Number(custom?.maxPriorityFeePerGas ?? body.maxPriorityFeePerGas ?? "0"),
  };
}

// Craft an unsigned single-clause Thor tx (VET transfer, or VIP-180 transfer for VTHO). The returned
// transaction is the JSON VechainSDKTransactionBody that combine() parses back — keep them in sync.
export async function craftTransaction(
  intent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!intent.recipient) {
    throw new Error("vechain: recipient is required");
  }
  // Validate sender up front: it is used for I/O (getAccount, estimateGas) below, so a malformed
  // value should fail clearly here instead of after a wasted network round trip.
  if (!parseAddress(intent.sender)) {
    throw new Error("vechain: invalid sender address");
  }

  const isToken = isTokenAsset(intent);
  let amount = await resolveAmount(intent, isToken);
  if (amount.lte(0)) {
    throw new Error("vechain: transaction amount must be positive");
  }

  let clauses = isToken
    ? await calculateClausesVtho(intent.recipient, amount)
    : await calculateClausesVet(intent.recipient, amount);

  const [{ gas, maxFeePerGas, maxPriorityFeePerGas }, blockRef] = await Promise.all([
    resolveGasFees(clauses, intent.sender, customFees),
    getBlockRef(),
  ]);

  const fee = new BigNumber(maxFeePerGas).times(gas);

  if (intent.useAllAmount && isToken) {
    amount = amount.minus(fee);
    if (amount.lte(0)) {
      throw new Error("vechain: VTHO balance too low to cover the transaction gas fee");
    }
    clauses = await calculateClausesVtho(intent.recipient, amount);
  }

  const body: VechainSDKTransactionBody = {
    chainTag: getChainTag(),
    blockRef,
    expiration: EXPIRATION,
    clauses,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    dependsOn: null,
    nonce: generateNonce(),
  };

  return {
    transaction: JSON.stringify(body),
    details: {
      fee: fee.toFixed(0),
      gas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      isTokenAccount: isToken,
    },
  };
}
