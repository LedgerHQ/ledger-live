import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import { AnyMessage } from "@ledgerhq/types-live";
import { TonSignature, TonSigner } from "./signer";
import { TonHwParams } from "./types";
import { getLedgerTonPath } from "./utils";

export const signMessage =
  (signerContext: SignerContext<TonSigner>) =>
  async (deviceId: string, account: Account, { message }: AnyMessage) => {
    if (typeof message !== "string") {
      throw new Error("Invalid message type");
    }

    if (!message) throw new Error("Message cannot be empty");
    if (typeof message !== "string") throw new Error("Message must be a string");

    const parsedMessage = JSON.parse(message);
    const ledgerPath = getLedgerTonPath(account.freshAddressPath);

    const sig = (await signerContext(deviceId, signer =>
      signer.signTransaction(ledgerPath, parsedMessage as TonHwParams),
    )) as TonSignature;

    if (!sig) {
      throw new Error("No signature");
    }

    return {
      rsv: {
        r: "",
        s: "",
        v: 0,
      },
      signature: sig.toString(),
    };
  };
