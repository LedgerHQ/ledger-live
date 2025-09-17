import coinConfig from "../../config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const feeValue = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).fee ?? 2n * 10n ** 38n;

export async function estimateFees(currency: CryptoCurrency): Promise<bigint> {
  return Promise.resolve(BigInt(feeValue(currency)));
}
