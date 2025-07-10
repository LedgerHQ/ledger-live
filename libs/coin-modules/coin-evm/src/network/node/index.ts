import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { UnknownNode } from "../../errors";
import { getCoinConfig } from "../../config";
import ledgerNodeApi from "./ledger";
import { NodeApi } from "./types";
import rpcNodeApi from "./rpc";

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  const config = getCoinConfig(currency).info;

  switch (config?.node?.type) {
    case "ledger":
      return ledgerNodeApi;
    case "external":
      return rpcNodeApi;

    default:
      throw new UnknownNode(`Unknown node for currency: ${currency.id}`);
  }
};
