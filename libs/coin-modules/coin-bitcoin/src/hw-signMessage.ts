import { Account, AnyMessage } from "@ledgerhq/types-live";
import { BitcoinSignature, SignerContext } from "./signer";

export const signMessage =
  (signerContext: SignerContext) =>
  async (deviceId: string, account: Account, container: AnyMessage) => {
    if (typeof container.message !== "string") {
      throw new Error("Invalid message type");
    }

    const hexMessage = Buffer.from(container.message).toString("hex");
    const path = "path" in container && container.path ? container.path : account.freshAddressPath;
    const result = (await signerContext(deviceId, account.currency, signer =>
      signer.signMessage(path, hexMessage),
    )) as BitcoinSignature;
    const v = result["v"] + 27 + 4;
    const signature = `${v.toString(16)}${result["r"]}${result["s"]}`;
    return {
      rsv: result,
      signature,
    };
  };
