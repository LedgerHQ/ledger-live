import {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction, post } from "../network";
import { decode58Check } from "../network/format";
import { TronMemo, TronResource, Vote } from "../types";
import { feesToNumber } from "./utils";

// Intent shape extended with the Tron-specific fields forwarded by transactionToIntent.
type TronStakingIntent = TransactionIntent<TronMemo> & {
  resource?: TronResource | null;
  votes?: Vote[];
};

export async function craftTransaction(
  transactionIntent: TransactionIntent<TronMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const intent = transactionIntent as TronStakingIntent;
  const { asset, recipient, sender, amount, expiration, type } = intent;
  const rawMemo = "memo" in intent ? intent.memo : undefined;
  const memo = rawMemo?.type === "string" && rawMemo.kind === "memo" ? rawMemo.value : undefined;

  const senderAddress = decode58Check(sender);

  switch (type) {
    case "freeze": {
      const result = await post<unknown, { raw_data_hex?: string }>("/wallet/freezebalancev2", {
        frozen_balance: Number(amount),
        resource: intent.resource,
        owner_address: senderAddress,
      });
      return { transaction: result.raw_data_hex as string };
    }

    case "unfreeze": {
      const result = await post<unknown, { raw_data_hex?: string }>("/wallet/unfreezebalancev2", {
        owner_address: senderAddress,
        resource: intent.resource,
        unfreeze_balance: Number(amount),
      });
      return { transaction: result.raw_data_hex as string };
    }

    case "vote": {
      const votes = intent.votes ?? [];
      const result = await post<unknown, { raw_data_hex?: string }>(
        "/wallet/votewitnessaccount",
        {
          owner_address: senderAddress,
          votes: votes.map(v => ({
            vote_address: decode58Check(v.address),
            vote_count: v.voteCount,
          })),
        },
      );
      return { transaction: result.raw_data_hex as string };
    }

    case "claimReward": {
      const result = await post<unknown, { raw_data_hex?: string }>("/wallet/withdrawbalance", {
        owner_address: senderAddress,
      });
      return { transaction: result.raw_data_hex as string };
    }

    case "withdrawExpireUnfreeze": {
      const result = await post<unknown, { raw_data_hex?: string }>(
        "/wallet/withdrawexpireunfreeze",
        { owner_address: senderAddress },
      );
      return { transaction: result.raw_data_hex as string };
    }

    case "unDelegateResource": {
      const result = await post<unknown, { raw_data_hex?: string }>(
        "/wallet/undelegateresource",
        {
          balance: Number(amount),
          resource: intent.resource,
          owner_address: senderAddress,
          receiver_address: decode58Check(recipient),
        },
      );
      return { transaction: result.raw_data_hex as string };
    }

    case "legacyUnfreeze": {
      const result = await post<unknown, { raw_data_hex?: string }>("/wallet/unfreezebalance", {
        resource: intent.resource,
        owner_address: senderAddress,
        ...(recipient ? { receiver_address: decode58Check(recipient) } : {}),
      });
      return { transaction: result.raw_data_hex as string };
    }

    default: {
      // send (native TRX, TRC10, TRC20)
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

        const { raw_data_hex: rawDataHex } = await craftTrc20Transaction(
          asset.assetReference,
          decode58Check(recipient),
          senderAddress,
          new BigNumber(amount.toString()),
          feesToNumber(fees),
          expiration,
        );
        return { transaction: rawDataHex as string };
      } else {
        const isTransferAsset = asset.type === "trc10";
        const tokenId = asset.type === "trc10" ? asset.assetReference : undefined;
        const { raw_data_hex: rawDataHex } = await craftStandardTransaction(
          tokenId,
          decode58Check(recipient),
          senderAddress,
          new BigNumber(amount.toString()),
          isTransferAsset,
          memo,
          expiration,
        );
        return { transaction: rawDataHex as string };
      }
    }
  }
}
