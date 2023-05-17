import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { AlgorandAPI } from "./api";
import { buildTransactionPayload, encodeToSign } from "./buildTransaction";
import type { Transaction } from "./types";

// This is only true for a single signature. If we ever support different type of signatures
// (e.g multi signatures), we will have to add the correct corresponding number of bytes.
const SINGLE_SIGNATURE_SIZE = 71;

export const getEstimatedFees =
  (algorandAPI: AlgorandAPI) =>
  async (account: Account, transaction: Transaction): Promise<BigNumber> => {
    const params = await algorandAPI.getTransactionParams();

    let suggestedFees = 0;
    if (params.fee) {
      const payload = await buildTransactionPayload(algorandAPI)(
        account,
        transaction
      );
      const encoded = encodeToSign(payload);
      suggestedFees =
        params.fee *
        (Buffer.from(encoded, "hex").length + SINGLE_SIGNATURE_SIZE);
    }
    return new BigNumber(Math.max(suggestedFees, params.minFee));
  };
