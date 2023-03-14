import Transport from "@ledgerhq/hw-transport";
import Vet from "@ledgerhq/hw-app-vet";
import { Transaction as ThorTransaction } from "thor-devkit";

export const signMessage = async (
  transport: Transport,
  {
    path,
    message,
    rawMessage,
  }: { path: string; message: string; rawMessage: string }
): Promise<string> => {
  let messageObj;
  let unsigned;
  try {
    messageObj = JSON.parse(message);
    unsigned = new ThorTransaction(messageObj);
  } catch (e) {
    console.error(e);
  }
  const vet = new Vet(transport);

  const result = await vet.signTransaction(
    path,
    unsigned.encode().toString("hex")
  );

  return result.toString("hex");
};

export default { signMessage };
