import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfig } from "../../logic";
import { UnknownNode } from "../../errors";
import ledgerNodeApi from "./ledger";
import { NodeApi } from "./types";
import rpcNodeApi from "./rpc";

export const getNodeApi = async (currency: CryptoCurrency): Promise<NodeApi> => {
  const { node } = await getCurrencyConfig(currency);
  switch (node?.type) {
    case "ledger":
      return ledgerNodeApi;
    case "external":
      return rpcNodeApi;

    default:
      throw new UnknownNode(`Unknown node for currency: ${currency.id}`);
  }
};
