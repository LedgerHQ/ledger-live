import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { log } from "@ledgerhq/logs";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { getBufferFromString } from "./bridge/utils";
import { FilecoinSigner } from "./types";

export const signMessage =
  (signerContext: SignerContext<FilecoinSigner>) =>
  async (deviceId: string, account: Account, { message }: AnyMessage) => {
    log("debug", "start signMessage process");

    if (typeof message !== "string") throw new Error("Invalid message type");
    if (!message) throw new Error("Message cannot be empty");

    const r = await signerContext(deviceId, signer =>
      signer.sign(account.freshAddressPath, getBufferFromString(message)),
    );

    return {
      rsv: {
        r: Buffer.from(r.signature_compact.slice(0, 32)).toString("hex"),
        s: Buffer.from(r.signature_compact.slice(32, 64)).toString("hex"),
        v: parseInt(Buffer.from(r.signature_compact.slice(64, 65)).toString("hex"), 16),
      },
      signature: `0x${Buffer.from(r.signature_compact).toString("hex")}`,
    };
  };
