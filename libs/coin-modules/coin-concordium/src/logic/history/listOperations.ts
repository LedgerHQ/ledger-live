import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getOperations as getOperationsGrpc } from "../../network/grpcClient";
import { getOperations as getOperationsProxy, ProxyOperation } from "../../network/proxyClient";

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param pagination Pagination options
 * @param currency The cryptocurrency
 * @returns Operations found and the next "id" or "index" to use for pagination (i.e. `start` property).\
 */
export async function listOperations(
  address: string,
  page: Pagination,
  currency: CryptoCurrency,
): Promise<[Operation[], string]> {
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "",
  });

  if (page.minHeight > 0) {
    return getOperationsGrpc(currency, address, page);
  }

  const operations = await getOperationsProxy(currency, address, accountId);

  return [
    operations.map(
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
    "",
  ];
}
