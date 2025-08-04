import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";

export async function submitTransaction({
  transaction,
  currency,
}: {
  transaction: string;
  currency: CryptoCurrency;
}): Promise<{ hash: string }> {
  const res = await network<{ transaction: { hash: string } }>({
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
