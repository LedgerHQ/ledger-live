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
import { apiForCurrency } from "../../../api/Ethereum";

const NotOwnedNft = createCustomErrorClass("NotOwnedNft");

export type Modes = "erc721.transfer";

export async function prepareTransaction(
  account: Account,
  transaction: Transaction
): Promise<Transaction> {
  let t = transaction;
  const { collection, collectionName, tokenIds } = transaction;
  if (collection && tokenIds && typeof collectionName === "undefined") {
    const api = apiForCurrency(account.currency);
    const [{ status, result }] = await api.getNFTCollectionMetadata(
      [
        {
          contract: collection,
        },
      ],
      account.currency?.ethereumLikeInfo?.chainId?.toString() || "1"
    );
    let collectionName = ""; // default value fallback if issue
    if (status === 200) {
      collectionName = result?.tokenName || "";
    }
    t = { ...t, collectionName };
  }
  return Promise.resolve(t);
}

const erc721Transfer: ModeModule = {
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

      if (
        !a.nfts?.find?.(
          (n) => n.tokenId === t.tokenIds?.[0] && n.contract === t.collection
        )
      ) {
        result.errors.amount = new NotOwnedNft();
      }
    }
  },

  prepareTransaction,

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
      standard: "ERC721",
      contract: eip55.encode(t.collection ?? ""),
      tokenId,
      value: t.quantities?.[i] || new BigNumber(0),
    }));
  },

  getResolutionConfig: () => ({ nft: true }),
};

function serializeTransactionData(
  account: Account,
  transaction: Transaction
): Buffer | null | undefined {
  const from = eip55.encode(account.freshAddress);
  const to = eip55.encode(transaction.recipient);

  return abi.simpleEncode(
    "safeTransferFrom(address,address,uint256,bytes)",
    from,
    to,
    transaction.tokenIds?.[0],
    "0x00"
  );
}

export const modes: Record<Modes, ModeModule> = {
  "erc721.transfer": erc721Transfer,
};
