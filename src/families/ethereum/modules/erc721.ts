import eip55 from "eip55";
import abi from "ethereumjs-abi";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import {
  createCustomErrorClass,
  NotEnoughBalanceInParentAccount,
} from "@ledgerhq/errors";
import { validateRecipient } from "../transaction";
import type { ModeModule, Transaction } from "../types";
import type { Account } from "../../../types";

const notOwnedNft = createCustomErrorClass("NotOwnedNft");

export type Modes = "erc721.transfer";

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
    validateRecipient(a.currency, t.recipient, result);

    if (!result.errors.recipient) {
      result.totalSpent = result.estimatedFees;
      result.amount = new BigNumber(t.amount);

      if (result.estimatedFees.gt(a.spendableBalance)) {
        result.errors.amount = new NotEnoughBalanceInParentAccount();
      }

      if (
        !a.nfts?.find?.(
          (n) =>
            n.tokenId === t.tokenIds?.[0] &&
            n.collection.contract === t.collection
        )
      ) {
        result.errors.amount = new notOwnedNft();
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
      value: `ERC721.transfer`,
    });

    fields.push({
      type: "text",
      label: "Collection",
      value: input.transaction.collection ?? "",
    });

    fields.push({
      type: "text",
      label: "Token ID",
      value: input.transaction.tokenIds?.[0] ?? "",
    });
  },

  /**
   * Optimistic Operation is filled post signing
   */
  fillOptimisticOperation(a, t, op) {
    op.type = "FEES";
    op.extra = {
      ...op.extra,
      approving: true, // workaround to track the status ENABLING
    };
  },
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
