import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { log } from "@ledgerhq/logs";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { getBufferFromString } from "./common-logic/utils";
import { CasperSigner } from "./types";

export const signMessage =
  (signerContext: SignerContext<CasperSigner>) =>
  async (deviceId: string, account: Account, { message }: AnyMessage) => {
    log("debug", "start signMessage process");

    if (!message) throw new Error(`Message cannot be empty`);
    if (typeof message !== "string") throw new Error(`Signing EIP712Message not supported`);

    const r = await signerContext(
      deviceId,
      async signer => await signer.sign(account.freshAddressPath, getBufferFromString(message)),
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

export default { signMessage };
