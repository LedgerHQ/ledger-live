import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../../config";
import { submit } from "../../network/gateway";

const useGateway = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).useGateway === true;

export async function broadcast(currency: CryptoCurrency, signedTx: string): Promise<string> {
  const parsed: { serialized: string; signature: string } = JSON.parse(signedTx);
  const [sig, party] = parsed.signature.split("__PARTY__");
  if (useGateway(currency))
    return (await submit(currency, party, parsed.serialized, sig)).update_id;
  else throw new Error("Not implemented");
}
