import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import network from "../../../network";
import {
  CARDANO_API_ENDPOINT,
  CARDANO_TESTNET_API_ENDPOINT,
} from "../constants";
import { isTestnet } from "../logic";
import { APITransaction } from "./api-types";

export async function submitTransaction({
  transaction,
  currency,
}: {
  transaction: string;
  currency: CryptoCurrency;
}): Promise<APITransaction> {
  const res = await network({
    method: "POST",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/transaction/submit`
      : `${CARDANO_API_ENDPOINT}/v1/transaction/submit`,
    data: {
      transaction: transaction,
    },
  });
  return res.data.transaction;
}
