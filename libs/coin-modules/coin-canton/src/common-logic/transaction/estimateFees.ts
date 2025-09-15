import coinConfig from "../../config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const feeValue = (currency: CryptoCurrency) => coinConfig.getCoinConfig(currency).fee ?? 1;

export async function estimateFees(currency: CryptoCurrency): Promise<bigint> {
  return Promise.resolve(BigInt(feeValue(currency)));
}
