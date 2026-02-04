import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../../config";
import { UnknownNode } from "../../errors";
import ledgerNodeApi from "./ledger";
import rpcNodeApi from "./rpc";
import { NodeApi } from "./types";

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
