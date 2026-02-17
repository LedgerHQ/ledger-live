import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { log } from "@ledgerhq/logs";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { getBufferFromString } from "./common-logic/utils";
import { ICPSigner } from "./types";

function bufferToArrayBuffer(buffer: Buffer): Buffer {
  const sig = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return Buffer.from(sig);
}

export const signMessage =
  (signerContext: SignerContext<ICPSigner>) =>
  async (deviceId: string, account: Account, { message }: AnyMessage) => {
    log("debug", "start signMessage process");

    if (!message) throw new Error("Message cannot be empty");
    if (typeof message !== "string") throw new Error("Message must be a string");

    const { r } = await signerContext(deviceId, async signer => {
      const r = await signer.sign(account.freshAddressPath, getBufferFromString(message));
      return { r };
    });

    if (!r.signatureRS) {
      throw Error("Signing failed");
    }

    return {
      rsv: {
        r: "",
        s: "",
        v: 0,
      },
      signature: bufferToArrayBuffer(r.signatureRS).toString("hex"),
    };
  };
