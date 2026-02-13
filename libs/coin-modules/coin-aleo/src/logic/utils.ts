import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
import { OperationType } from "@ledgerhq/types-live";
import aleoConfig from "../config";
import { AleoTransactionType } from "../types";
import { TRANSFERS } from "../constants";

export function parseMicrocredits(microcreditsU64: string): string {
  const value = microcreditsU64.split(".")[0];
  const expectedSuffix = "u64";
  const hasValidSuffix = value.endsWith(expectedSuffix);
  invariant(hasValidSuffix, `aleo: invalid microcredits format (${microcreditsU64})`);
  return value.replace(expectedSuffix, "");
}

export function getNetworkConfig(currency: CryptoCurrency) {
  const config = aleoConfig.getCoinConfig(currency);

  return {
    nodeUrl: config.apiUrls.node,
    sdkUrl: config.apiUrls.sdk,
    networkType: config.networkType,
  };
}

export const determineTransactionType = (
  functionId: string,
  operationType: OperationType,
): AleoTransactionType => {
  if (functionId === TRANSFERS.PRIVATE) return "private";
  if (functionId === TRANSFERS.PUBLIC) return "public";
  if (operationType === "IN") {
    if (functionId.endsWith("to_private")) {
      return "private";
    } else if (functionId.endsWith("to_public")) {
      return "public";
    }
  } else if (operationType === "OUT") {
    if (functionId.startsWith(TRANSFERS.PRIVATE)) {
      return "private";
    } else if (functionId.startsWith(TRANSFERS.PUBLIC)) {
      return "public";
    }
  }

  if (operationType === "OUT") {
    return functionId.startsWith("transfer_private") ? "private" : "public";
  }

  return "public";
};
