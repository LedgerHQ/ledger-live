import { log } from "@ledgerhq/logs";
import { COST_PER_BYTE, getRevealFee, ORIGINATION_SIZE, Estimate } from "@taquito/taquito";
import { validatePublicKey, ValidationResult } from "@taquito/utils";
import coinConfig from "../config";
import { UnsupportedTransactionMode } from "../types/errors";
import { TezosOperationMode } from "../types/model";
import {
  computeMaxStakeAmount,
  createFallbackEstimation,
  createMockSigner,
  DUST_MARGIN_MUTEZ,
  MIN_SUGGESTED_FEE_SMALL_TRANSFER,
  OP_SIZE_XTZ_TRANSFER,
  normalizePublicKeyForAddress,
} from "../utils";
import { getTezosToolkit } from "./tezosToolkit";

export type CoreAccountInfo = {
  address: string;
  balance: bigint;
  stakedBalance?: bigint;
  revealed: boolean;
  xpub?: string;
};
export type CoreTransactionInfo = {
  mode: TezosOperationMode;
  recipient: string;
  amount: bigint;
  useAllAmount?: boolean;
  /** FA2 token contract; required when `mode` is `send_token` */
  contractAddress?: string;
  /** FA2 token id; required when `mode` is `send_token` */
  tokenId?: number;
};

export type EstimatedFees = {
  fees: bigint;
  gasLimit: bigint;
  storageLimit: bigint;
  estimatedFees: bigint;
  amount?: bigint;
  taquitoError?: string;
};

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} account
 * @param {Transaction} transaction
 */
export async function estimateFees({
  account,
  transaction,
}: {
  account: CoreAccountInfo;
  transaction: CoreTransactionInfo;
}): Promise<EstimatedFees> {
  // Normalize public key (hex -> base58) when provided (may be undefined for unrevealed accounts)
  // before the device is connected
  const encodedPubKey = account.xpub
    ? normalizePublicKeyForAddress(account.xpub, account.address)
    : undefined;

  const tezosToolkit = getTezosToolkit();
  if (encodedPubKey && validatePublicKey(encodedPubKey) === ValidationResult.VALID) {
    tezosToolkit.setProvider({ signer: createMockSigner(account.address, encodedPubKey) });
  } else {
    tezosToolkit.setProvider({ signer: createMockSigner(account.address, "") });
  }

  const estimation: EstimatedFees = {
    fees: 0n,
    gasLimit: 0n,
    storageLimit: 0n,
    estimatedFees: 0n,
  };

  // For legacy compatibility
  if (account.balance === 0n) {
    return transaction.useAllAmount ? { ...estimation, amount: 0n } : estimation;
  }

  let amount = transaction.amount;
  const coerceMinAmountForEstimation =
    (transaction.useAllAmount &&
      (transaction.mode === "send" ||
        transaction.mode === "stake" ||
        transaction.mode === "unstake")) ||
    (amount === 0n && transaction.mode !== "send_token");
  if (coerceMinAmountForEstimation) {
    amount = 1n; // send/stake max or zero-amount pre-estimation (taquito refuses 0); not used for FA2 send_token
  }

  try {
    if (
      (transaction.mode === "send" || transaction.mode === "send_token") &&
      !transaction.recipient
    ) {
      return {
        ...estimation,
        ...createFallbackEstimation(),
      };
    }
    let estimate: Estimate;
    switch (transaction.mode) {
      case "send":
        estimate = await tezosToolkit.estimate.transfer({
          mutez: true,
          to: transaction.recipient,
          amount: Number(amount),
          source: account.address, // avoid requiring signer for estimation
          storageLimit: ORIGINATION_SIZE, // https://github.com/TezTech/eztz/blob/master/PROTO_003_FEES.md for originating an account
        });
        break;
      case "delegate":
        estimate = await tezosToolkit.estimate.setDelegate({
          source: account.address,
          delegate: transaction.recipient,
        });
        break;
      case "undelegate":
        estimate = await tezosToolkit.estimate.setDelegate({
          source: account.address,
        });
        break;
      case "stake":
        estimate = await tezosToolkit.estimate.stake({
          amount: Number(amount),
          mutez: true,
        });
        break;
      case "unstake":
        estimate = await tezosToolkit.estimate.unstake({
          amount: Number(amount),
          mutez: true,
        });
        break;
      case "finalize_unstake":
        estimate = await tezosToolkit.estimate.finalizeUnstake({});
        break;
      case "send_token": {
        if (!transaction.contractAddress || transaction.tokenId === undefined) {
          throw new Error("FA2 transfer requires contractAddress and tokenId");
        }
        const tokenContract = await tezosToolkit.contract.at(transaction.contractAddress);
        const transferParams = tokenContract.methods
          .transfer([
            {
              from_: account.address,
              txs: [
                {
                  to_: transaction.recipient,
                  token_id: transaction.tokenId,
                  amount: amount,
                },
              ],
            },
          ])
          .toTransferParams({ mutez: true });
        estimate = await tezosToolkit.estimate.transfer({
          ...transferParams,
          source: account.address,
        });
        break;
      }
      default:
        throw new UnsupportedTransactionMode("unsupported mode", { mode: transaction.mode });
    }

    const minFees = coinConfig.getCoinConfig().fees.minFees ?? 0;
    const mainOpFee = Math.max(minFees, estimate.suggestedFeeMutez);
    const revealFee = account.revealed ? 0n : BigInt(getRevealFeeForEstimation(account.address));

    // NOTE: send-max only applies to native XTZ transfer, not FA2
    if (transaction.useAllAmount && transaction.mode === "send") {
      // NOTE: from https://github.com/ecadlabs/taquito/blob/master/integration-tests/__tests__/contract/empty-implicit-account-into-new-implicit-account.spec.ts#L37
      const totalFees =
        estimate.burnFeeMutez > 0
          ? estimate.suggestedFeeMutez + estimate.burnFeeMutez - 20 * COST_PER_BYTE // 20 is storage buffer
          : estimate.suggestedFeeMutez;
      const maxAmount = parseInt(account.balance.toString()) - (totalFees + Number(revealFee));
      // NOTE: from https://github.com/ecadlabs/taquito/blob/a70c64c4b105381bb9f1d04c9c70e8ef26e9241c/integration-tests/contract-empty-implicit-account-into-new-implicit-account.spec.ts#L33
      // Temporary fix, see https://gitlab.com/tezos/tezos/-/issues/1754
      // we need to increase the gasLimit and fee returned by the estimation
      const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
      const incr = DUST_MARGIN_MUTEZ * MINIMAL_FEE_PER_GAS_MUTEZ + Number(estimate.opSize);
      const maxMinusBuff = maxAmount - (DUST_MARGIN_MUTEZ - incr);
      estimation.amount = maxMinusBuff > 0 ? BigInt(maxMinusBuff) : 0n;
    } else if (transaction.useAllAmount && transaction.mode === "stake") {
      estimation.amount = computeMaxStakeAmount(
        BigInt(account.balance),
        account.stakedBalance ?? 0n,
        BigInt(mainOpFee) + revealFee,
      );
    } else {
      estimation.amount = transaction.amount;
    }

    estimation.fees = BigInt(mainOpFee);
    estimation.gasLimit = BigInt(estimate.gasLimit);
    estimation.storageLimit = BigInt(estimate.storageLimit);
    estimation.estimatedFees = estimation.fees + revealFee;
  } catch (e) {
    if (typeof e !== "object" || !e) throw e;
    if ("id" in e) {
      estimation.taquitoError = (e as { id: string }).id;
      log("taquito-error", "taquito got error " + e.id);
    } else if ("status" in e) {
      const errorMessage = String((e as unknown as { message: string }).message || "");
      if (
        errorMessage.includes("Public key not found") ||
        errorMessage.includes("wallet or contract API")
      ) {
        log(
          "taquito-network-error",
          "Recipient address not found (new account), using default fees",
          {
            transaction: transaction,
          },
        );
        const fallback = createFallbackEstimation();
        estimation.fees = fallback.fees;
        estimation.gasLimit = fallback.gasLimit;
        estimation.storageLimit = fallback.storageLimit;
        estimation.estimatedFees = fallback.fees;
        if (!account.revealed) {
          estimation.estimatedFees =
            estimation.estimatedFees + BigInt(getRevealFeeForEstimation(account.address));
        }
        // Handle useAllAmount also for send mode when estimation falls back
        if (transaction.useAllAmount && transaction.mode === "send") {
          // Approximate Taquito behavior for send-max using stable constants
          const suggestedFee =
            transaction.mode === "send"
              ? MIN_SUGGESTED_FEE_SMALL_TRANSFER
              : Number(estimation.fees);

          // For display consistency in tests, align fees to suggestedFee in send-max
          if (transaction.mode === "send") {
            estimation.fees = BigInt(suggestedFee);
            estimation.estimatedFees = BigInt(suggestedFee);
            if (!account.revealed) {
              estimation.estimatedFees =
                estimation.estimatedFees + BigInt(getRevealFeeForEstimation(account.address));
            }
          }

          const burnFeeMutez = Number(estimation.storageLimit) * COST_PER_BYTE;
          const totalFees =
            suggestedFee + (burnFeeMutez > 0 ? burnFeeMutez - 20 * COST_PER_BYTE : 0);

          const revealFee = account.revealed ? 0 : getRevealFeeForEstimation(account.address);
          const maxAmount = Number.parseInt(account.balance.toString()) - (totalFees + revealFee);

          const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
          const incr = OP_SIZE_XTZ_TRANSFER + DUST_MARGIN_MUTEZ * MINIMAL_FEE_PER_GAS_MUTEZ;
          const maxMinusBuff = maxAmount - (DUST_MARGIN_MUTEZ - incr);
          estimation.amount = maxMinusBuff > 0 ? BigInt(Math.floor(maxMinusBuff)) : 0n;
        } else {
          // preserve input amount in fallback for readability/tests
          estimation.amount = transaction.amount;
        }
      } else {
        log("taquito-network-error", errorMessage, {
          transaction: transaction,
        });
        throw e;
      }
    } else {
      const msg = String((e as any).message || "");
      if (msg.includes("No signer has been configured")) {
        const fallback = createFallbackEstimation();
        estimation.fees = fallback.fees;
        estimation.gasLimit = fallback.gasLimit;
        estimation.storageLimit = fallback.storageLimit;
        estimation.estimatedFees = fallback.estimatedFees;
        if (!account.revealed) {
          estimation.estimatedFees =
            estimation.estimatedFees + BigInt(getRevealFeeForEstimation(account.address));
        }
        if (transaction.useAllAmount && transaction.mode === "send") {
          const suggestedFee =
            transaction.mode === "send"
              ? MIN_SUGGESTED_FEE_SMALL_TRANSFER
              : Number(estimation.fees);

          if (transaction.mode === "send") {
            estimation.fees = BigInt(suggestedFee);
            estimation.estimatedFees = BigInt(suggestedFee);
            if (!account.revealed) {
              estimation.estimatedFees =
                estimation.estimatedFees + BigInt(getRevealFeeForEstimation(account.address));
            }
          }

          const burnFeeMutez = Number(estimation.storageLimit) * COST_PER_BYTE;
          const totalFees =
            suggestedFee + (burnFeeMutez > 0 ? burnFeeMutez - 20 * COST_PER_BYTE : 0);
          const revealFee = account.revealed ? 0 : getRevealFeeForEstimation(account.address);
          const maxAmount = Number.parseInt(account.balance.toString()) - (totalFees + revealFee);
          const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
          const incr = OP_SIZE_XTZ_TRANSFER + DUST_MARGIN_MUTEZ * MINIMAL_FEE_PER_GAS_MUTEZ;
          const maxMinusBuff = maxAmount - (DUST_MARGIN_MUTEZ - incr);
          estimation.amount = maxMinusBuff > 0 ? BigInt(Math.floor(maxMinusBuff)) : 0n;
        } else {
          // preserve input amount in fallback for readability/tests
          estimation.amount = transaction.amount;
        }
      } else {
        throw e;
      }
    }
  }
  return estimation;
}

function getRevealFeeForEstimation(address: string): number {
  const minFees = coinConfig.getCoinConfig().fees.minFees ?? 0;
  return Math.max(minFees, getRevealFee(address));
}
