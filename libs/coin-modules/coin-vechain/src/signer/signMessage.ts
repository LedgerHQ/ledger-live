import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { VechainSDKTransaction, VechainSigner } from "../types";

export const signMessage =
  (signerContext: SignerContext<VechainSigner>) =>
  async (deviceId: string, path: string, message: string, rawMessage: string) => {
    let messageObj;
    let unsigned: VechainSDKTransaction;
    try {
      if (message) messageObj = JSON.parse(message);
      else messageObj = JSON.parse(rawMessage);
      unsigned = VechainSDKTransaction.of(messageObj);
    } catch {
      throw new Error("Message is not a valid JSON object");
    }
    const result = await signerContext(deviceId, signer =>
      signer.signTransaction(path, Buffer.from(unsigned.encoded).toString("hex")),
    );

    return result.toString("hex");
  };
