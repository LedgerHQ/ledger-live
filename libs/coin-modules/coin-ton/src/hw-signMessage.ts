import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { TonSigner } from "./signer";
import { TonTransaction } from "./types";
import { getLedgerTonPath } from "./utils";

export const signMessage =
  (signerContext: SignerContext<TonSigner>) =>
  async (deviceId: string, account: Account, { message }: AnyMessage) => {
    if (typeof message !== "string") throw new Error("Invalid message value");

    const parsedMessage = JSON.parse(message);
    const ledgerPath = getLedgerTonPath(account.freshAddressPath);

    const sig = await signerContext(deviceId, signer =>
      signer.signTransaction(ledgerPath, parsedMessage as TonTransaction),
    );

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
