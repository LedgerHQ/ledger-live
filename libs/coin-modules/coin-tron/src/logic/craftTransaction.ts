import {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  DEFAULT_TRC20_FEES_LIMIT,
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

async function craftSend(
  config: TronCoinConfig,
  transactionIntent: TransactionIntent<TronMemo, TronTxData>,
  memo: string | undefined,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const { amount, asset, recipient, sender, expiration } = transactionIntent;

  if (asset.type === "trc20" && asset.assetReference) {
    const fees = customFees?.value;
    if (fees !== undefined && (fees < 0n || fees > BigInt(Number.MAX_SAFE_INTEGER))) {
      throw new Error(
        `fees must be between 0 and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
      );
    }

    if (memo !== undefined) {
      throw new Error("Memo cannot be used with smart contract transactions");
    }

    // `fee_limit` caps what the TVM may burn, it is not a charge: whatever the contract call leaves
    // unused is never taken. What arrives here is an *estimate* of the cost rather than a cap anyone
    // chose — Tron's fee descriptor is `hasCustom: false`, so nothing in the app can set one. Capping
    // at the estimate turns any under-estimate into an OUT_OF_ENERGY revert with the fee still burned,
    // and a USDT transfer costs roughly twice as much when it has to activate the recipient's token
    // balance — a state that can flip between estimating and broadcasting. So the cap only ratchets
    // up from `DEFAULT_TRC20_FEES_LIMIT`, still clearing an estimate above it.
    const feeLimit = Math.max(feesToNumber(fees) ?? 0, DEFAULT_TRC20_FEES_LIMIT);

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
