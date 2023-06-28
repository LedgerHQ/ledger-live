import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { NodeApi } from "./types";
import rpcNodeApi from "./rpc";

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  switch (currency.ethereumLikeInfo?.node?.type) {
    case "external":
      return rpcNodeApi;

    default:
      throw new Error();
  }
};
