import invariant from "invariant";

import { FeeEstimationFailed } from "@ledgerhq/errors";
import type { CryptoCurrency } from "../types";
import { makeLRUCache } from "../cache";
import { blockchainBaseURL } from "./Ledger";
import network from "../network";

export type Fees = Record<string, number>;

export const getEstimatedFees: (currency: CryptoCurrency) => Promise<Fees> =
  makeLRUCache(
    async (currency) => {
      const baseURL = blockchainBaseURL(currency);
      invariant(baseURL, `Fees for ${currency.id} are not supported`);
      const { data, status } = await network({
        method: "GET",
        url: `${baseURL}/fees`,
      });

      if (data) {
        return data;
      }

      throw new FeeEstimationFailed(`FeeEstimationFailed ${status}`, {
        httpStatus: status,
      });
    },
    (c) => c.id
  );
