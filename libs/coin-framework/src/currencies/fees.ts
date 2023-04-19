import invariant from "invariant";

import { FeeEstimationFailed } from "@ledgerhq/errors";
import { makeLRUCache } from "../../../ledger-live-common/cache";
import { blockchainBaseURL } from "./explorer";
import network from "@../../../ledger-live-common/network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

type Fees = Record<string, number>;

export const getEstimatedFees: (
  currency: CryptoCurrency
) => Promise<Fees> = async (currency) => {
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
};
