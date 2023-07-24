import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { UnknownNode } from "../../errors";
import ledgerNodeApi from "./ledger";
import { NodeApi } from "./types";
import rpcNodeApi from "./rpc";

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  switch (currency.ethereumLikeInfo?.node?.type) {
    case "ledger":
      return ledgerNodeApi;
    case "external":
      return rpcNodeApi;

    default:
      throw new UnknownNode(`Unknown node for currency: ${currency.id}`);
  }
};
