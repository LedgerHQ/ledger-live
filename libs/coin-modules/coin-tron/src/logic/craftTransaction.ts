import {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  claimRewardTronTransaction,
  craftStandardTransaction,
  craftTrc20Transaction,
  freezeTronTransaction,
  legacyUnfreezeTronTransaction,
  unDelegateResourceTransaction,
  unfreezeTronTransaction,
  voteTronSuperRepresentatives,
  withdrawExpireUnfreezeTronTransaction,
} from "../network";
import { decode58Check } from "../network/format";
import { TronMemo, TronTxData } from "../types";
import { feesToNumber } from "./utils";

export async function craftTransaction(
  config: TronCoinConfig,
  transactionIntent: TransactionIntent<TronMemo, TronTxData>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const { recipient, sender, amount, type } = transactionIntent;
  const rawMemo = "memo" in transactionIntent ? transactionIntent.memo : undefined;
  const memo = rawMemo?.type === "string" && rawMemo.kind === "memo" ? rawMemo.value : undefined;

  // Resource-staking fields travel in the TxData generic (ADR-047), never as loose intent fields.
  // `data` is a required member, but a hand-built intent (the coin-tester, a script) can still omit
  // it, so the reads below tolerate its absence.
  const data: TronTxData | undefined = transactionIntent.data;
  const resource = data?.resource;
  // Converted per branch rather than up front: `craftSend` must validate custom fees before it
  // touches the amount, so that an out-of-range fee reports the fee error and not a cast failure.
  const value = (): BigNumber => new BigNumber(amount.toString());

  switch (type) {
    case "freeze":
      return toCrafted(await freezeTronTransaction(config, sender, value(), resource));

    case "unfreeze":
      return toCrafted(await unfreezeTronTransaction(config, sender, value(), resource));

    case "vote":
      return toCrafted(await voteTronSuperRepresentatives(config, sender, data?.votes ?? []));

    case "claimReward":
      return toCrafted(await claimRewardTronTransaction(config, sender));

    case "withdrawExpireUnfreeze":
      return toCrafted(await withdrawExpireUnfreezeTronTransaction(config, sender));

    case "unDelegateResource":
      return toCrafted(
        await unDelegateResourceTransaction(config, {
          ownerAddress: sender,
          receiverAddress: recipient,
          amount: value(),
          resource,
        }),
      );

    case "legacyUnfreeze":
      // Pre-Stake-2.0 unfreeze. A recipient is only present when reclaiming a delegation.
      return toCrafted(
        await legacyUnfreezeTronTransaction(config, {
          ownerAddress: sender,
          resource,
          receiverAddress: recipient || undefined,
        }),
      );

    case "send":
      return craftSend(config, transactionIntent, memo, customFees);

    default:
      // The signing path must not be more permissive than `estimatedTxSize`, which rejects the same
      // input: crafting an unknown mode as a plain transfer would sign something the user never asked
      // for.
      throw new Error(`unsupported Tron intent type for crafting: ${type}`);
  }
}

function toCrafted({ raw_data_hex: rawDataHex }: { raw_data_hex?: string }): CraftedTransaction {
  if (!rawDataHex) {
    throw new Error("Tron node returned no raw_data_hex for the crafted transaction");
  }
  return { transaction: rawDataHex };
}

// `FeeEstimation.parameters` is `Record<string, unknown>`, and the generic layer carries it over a
// channel that JSON-normalises every numeric to a decimal string, so a fee figure can arrive as a
// bigint (a direct caller) or as a string (the wallet).
const toFeeAmount = (value: unknown): bigint | undefined => {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  return undefined;
};

async function craftSend(
  config: TronCoinConfig,
  transactionIntent: TransactionIntent<TronMemo, TronTxData>,
  memo: string | undefined,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const { amount, asset, recipient, sender, expiration } = transactionIntent;

  if (asset.type === "trc20" && asset.assetReference) {
    // `fee_limit` caps what the TVM may burn for energy, not a charge — unused energy is never
    // taken — so it must cover the worst-case burn. Three sources, in descending precedence:
    //
    // 1. `parameters.fees` — a deliberate override, which the wallet sets only when the user picks
    //    a custom fee. Wins over the estimate's ceiling because the two can arrive together
    //    (a custom fee with send-max still estimates, to resolve the max amount).
    // 2. `parameters.feeLimit` — the ceiling `estimateFees` published for this transaction. The
    //    wallet's auto path, where `value` is the net display fee: `0` once the account's own
    //    energy covers the transfer, so pinning the ceiling to it reverts OUT_OF_ENERGY
    //    (LIVE-36865).
    // 3. `customFees.value` — the cap a direct caller chose (coin-service `/transaction/encode`,
    //    and any other client of this module). Honoured verbatim, below the default or `0`
    //    included: the trade-off is the caller's to make and a silent override breaks a signer
    //    that re-parses the crafted blob and compares (VSD-5287/TSD-11634).
    //
    // With none of the three, `craftTrc20Transaction` applies its `DEFAULT_TRC20_FEES_LIMIT`.
    const fees =
      toFeeAmount(customFees?.parameters?.fees) ??
      toFeeAmount(customFees?.parameters?.feeLimit) ??
      customFees?.value;
    if (fees !== undefined && (fees < 0n || fees > BigInt(Number.MAX_SAFE_INTEGER))) {
      throw new Error(
        `fees must be between 0 and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
      );
    }

    if (memo !== undefined) {
      throw new Error("Memo cannot be used with smart contract transactions");
    }

    const feeLimit = feesToNumber(fees);

    return toCrafted(
      await craftTrc20Transaction(
        config,
        asset.assetReference,
        decode58Check(recipient),
        decode58Check(sender),
        new BigNumber(amount.toString()),
        feeLimit,
        expiration,
      ),
    );
  }

  const isTransferAsset = asset.type === "trc10";
  const tokenId = asset.type === "trc10" ? asset.assetReference : undefined;
  return toCrafted(
    await craftStandardTransaction(config, {
      tokenAddress: tokenId,
      recipientAddress: decode58Check(recipient),
      senderAddress: decode58Check(sender),
      amount: new BigNumber(amount.toString()),
      isTransferAsset,
      memo,
      expiration,
    }),
  );
}
