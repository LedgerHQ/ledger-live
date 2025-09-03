import coinConfig from "../../config";
import { submit } from "../../network/gateway";

const useGateway = () => coinConfig.getCoinConfig().useGateway === true;

export async function broadcast(signedTx: string): Promise<string> {
  const parsed: { serialized: string; signature: string } = JSON.parse(signedTx);
  if (useGateway()) return (await submit(parsed.serialized, parsed.signature)).updateId;
  else throw new Error("Not implemented");
}
