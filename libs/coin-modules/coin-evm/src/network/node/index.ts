import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../../config";
import { UnknownNode } from "../../errors";
import ledgerNodeApi from "./ledger";
import { createNodeApi, DEFAULT_RETRIES_RPC_METHODS } from "./rpc";
import { NodeApi } from "./types";

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  const config = getCoinConfig(currency).info;

  switch (config?.node?.type) {
    case "ledger":
      return ledgerNodeApi;
    case "external": {
      const retries = config.node.retries ?? DEFAULT_RETRIES_RPC_METHODS;
      return createNodeApi(retries);
    }

    default:
      throw new UnknownNode(`Unknown node for currency: ${currency.id}`);
  }
};
