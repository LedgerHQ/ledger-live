import coinConfig from "../../config";
import { submit } from "../../network/gateway";

const useGateway = () => coinConfig.getCoinConfig().useGateway === true;

export async function broadcast(signedTx: string): Promise<string> {
  const parsed: { serialized: string; signature: string } = JSON.parse(signedTx);
  const [sig, party] = parsed.signature.split("__PARTY__");
  if (useGateway()) return (await submit(party, parsed.serialized, sig)).update_id;
  else throw new Error("Not implemented");
}
