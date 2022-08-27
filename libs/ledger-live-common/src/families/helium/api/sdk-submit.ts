import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import network from "../../../network";
import { endpointByCurrencyId } from "../utils";

/**
 * Submit transaction.
 * @param txn transaction
 * @param currency currency of transaction.
 * @returns Promise with submit hash.
 */
const submit = async (
  txn: string,
  currency: CryptoCurrency
): Promise<{ hash: string; txn: string }> => {
  const root = endpointByCurrencyId(currency.id);
  const url = `${root}/pending_transactions`;

  const {
    data: {
      data: { hash },
    },
  } = await network({
    method: "POST",
    url,
    data: { txn },
    headers: {
      "User-Agent": "LedgerLive",
    },
  });

  return { hash, txn };
};

export default submit;
