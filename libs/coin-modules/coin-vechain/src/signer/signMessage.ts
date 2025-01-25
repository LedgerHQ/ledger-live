import { Transaction as ThorTransaction } from "thor-devkit";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { VechainSigner } from "../types";

export const signMessage =
  (signerContext: SignerContext<VechainSigner>) =>
  async (deviceId: string, path: string, message: string, rawMessage: string) => {
    let messageObj;
    let unsigned: ThorTransaction;
    try {
      if (message) messageObj = JSON.parse(message);
      else messageObj = JSON.parse(rawMessage);
      unsigned = new ThorTransaction(messageObj);
    } catch (e) {
      throw new Error("Message is not a valid JSON object");
    }
    const result = await signerContext(deviceId, signer =>
      signer.signTransaction(path, unsigned.encode().toString("hex")),
    );

    return result.toString("hex");
  };
