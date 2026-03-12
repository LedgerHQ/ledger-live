import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { Operation, ListOperationsOptions, Page } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getOperations as getOperationsGrpc } from "../../network/grpcClient";
import {
  getOperations as getOperationsProxy,
  type ProxyOperation,
} from "../../network/proxyClient";

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param options Pagination/filtering options
 * @param currency The cryptocurrency
 * @returns Operations found and the next "id" or "index" to use for pagination (i.e. `start` property).\
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
  currency: CryptoCurrency,
): Promise<Page<Operation>> {
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "",
  });

  if (options.minHeight > 0) {
    return getOperationsGrpc(currency, address, options);
  }

  const operations = await getOperationsProxy(currency, { address, accountId });

  return {
    items: operations.map(
      (op: ProxyOperation): Operation => ({
        id: op.id,
        asset: { type: "native" as const },
        tx: {
          hash: op.hash,
          fees: BigInt(op.fee.toString()),
          date: op.date,
          failed: false,
          block: {
            height: op.blockHeight || 0,
            hash: op.blockHash || op.hash,
            time: op.date,
          },
        },
        type: op.type,
        value: BigInt(op.value.toString()),
        senders: op.senders,
        recipients: op.recipients,
      }),
    ),
    next: undefined, // FIXME only first page is supported
  };
}
