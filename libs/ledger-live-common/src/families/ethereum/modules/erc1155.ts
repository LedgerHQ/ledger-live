import eip55 from "eip55";
import abi from "ethereumjs-abi";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import {
  createCustomErrorClass,
  NotEnoughBalanceInParentAccount,
} from "@ledgerhq/errors";
import type { ModeModule, Transaction } from "../types";
import type { Account } from "@ledgerhq/types-live";
import { prepareTransaction } from "./erc721";

const NotOwnedNft = createCustomErrorClass("NotOwnedNft");
const NotEnoughNftOwned = createCustomErrorClass("NotEnoughNftOwned");
const NotTokenIdsProvided = createCustomErrorClass("NotTokenIdsProvided");
const QuantityNeedsToBePositive = createCustomErrorClass(
  "QuantityNeedsToBePositive"
);

export type Modes = "erc1155.transfer";

const erc1155Transfer: ModeModule = {
  /**
   * Tx data is filled during the buildEthereumTx
   */
  fillTransactionData(a, t, tx) {
    const data = serializeTransactionData(a, t);
    invariant(data, "serializeTransactionData provided no data");
    tx.data = "0x" + (data as Buffer).toString("hex");
    tx.to = t.collection;
    tx.value = "0x00";
  },

  /**
   * Tx status is filled after the buildEthereumTx
   */
  fillTransactionStatus: (a, t, result) => {
    if (!result.errors.recipient) {
      result.totalSpent = result.estimatedFees;
      result.amount = new BigNumber(t.amount);

      if (result.estimatedFees.gt(a.spendableBalance)) {
        result.errors.amount = new NotEnoughBalanceInParentAccount();
      }

      t.quantities?.forEach((quantity) => {
        if (!quantity || quantity.isLessThan(1)) {
          result.errors.amount = new QuantityNeedsToBePositive();
        }
      });

      const enoughTokensOwned: true | Error =
        t.tokenIds?.reduce((acc, tokenId, index) => {
          if (acc instanceof Error) {
            return acc;
          }

          const nft = a.nfts?.find((n) => n.tokenId === tokenId);
          const transferQuantity = Number(t.quantities?.[index]);

          if (!nft) {
            return new NotOwnedNft();
          }

          if (transferQuantity && !nft.amount.gte(transferQuantity)) {
            return new NotEnoughNftOwned();
          }

          return true;
        }, true as true | Error) || new NotTokenIdsProvided();

      if (!enoughTokensOwned || enoughTokensOwned instanceof Error) {
        result.errors.amount = enoughTokensOwned;
      }
    }
  },

  /**
   * This will only be used by LLM & LLD, not the HW.
   */
  fillDeviceTransactionConfig(input, fields) {
    fields.push({
      type: "text",
      label: "Type",
      value: `NFT Transfer`,
    });

    fields.push({
      type: "text",
      label: "To",
      value: input.transaction.recipient ?? "",
    });

    fields.push({
      type: "text",
      label: "Collection Name",
      value: input.transaction.collectionName || "",
    });

    fields.push({
      type: "text",
      label: "Quantity",
      value: input.transaction.quantities?.[0]?.toFixed() ?? "",
    });

    fields.push({
      type: "address",
      label: "NFT Address",
      address: input.transaction.collection ?? "",
    });

    fields.push({
      type: "text",
      label: "NFT ID",
      value: input.transaction.tokenIds?.[0] ?? "",
    });
  },

  /**
   * Optimistic Operation is filled post signing
   */
  fillOptimisticOperation(a, t, op) {
    op.type = "FEES";
    op.nftOperations = t.tokenIds?.map((tokenId, i) => ({
      ...op,
      id: "", // operation ID will be filled by patchOperationWithHash
      type: "NFT_OUT",
      senders: [eip55.encode(a.freshAddress)],
      recipients: [eip55.encode(t.recipient)],
      standard: "ERC1155",
      contract: eip55.encode(t.collection ?? ""),
      tokenId,
      value: t.quantities?.[i] || new BigNumber(0),
    }));
  },

  prepareTransaction,

  getResolutionConfig: () => ({ nft: true }),
};

function serializeTransactionData(
  account: Account,
  transaction: Transaction
): Buffer | null | undefined {
  const from = eip55.encode(account.freshAddress);
  const to = eip55.encode(transaction.recipient);
  const tokenIds = transaction.tokenIds || [];
  const quantities = transaction.quantities?.map((q) => q.toFixed()) || [];

  return tokenIds?.length > 1
    ? abi.simpleEncode(
        "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
        from,
        to,
        tokenIds,
        quantities,
        "0x00"
      )
    : abi.simpleEncode(
        "safeTransferFrom(address,address,uint256,uint256,bytes)",
        from,
        to,
        tokenIds[0],
        quantities[0],
        "0x00"
      );
}

export const modes: Record<Modes, ModeModule> = {
  "erc1155.transfer": erc1155Transfer,
};
