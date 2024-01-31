import { Account, AnyMessage } from "@ledgerhq/types-live";
import { BitcoinSignature, SignerContext } from "./signer";

const signMessage = async (
  deviceId: string,
  signerContext: SignerContext,
  account: Account,
  { message }: AnyMessage,
) => {
  if (typeof message !== "string") {
    throw new Error("Invalid message type");
  }

  const hexMessage = Buffer.from(message).toString("hex");
  const result = (await signerContext(deviceId, account.currency, signer =>
    signer.signMessage(account.freshAddressPath, hexMessage),
  )) as BitcoinSignature;
  const v = result["v"] + 27 + 4;
  const signature = Buffer.from(`${v.toString(16)}${result["r"]}${result["s"]}`, "hex").toString(
    "base64",
  );
  return {
    rsv: result,
    signature,
  };
};

export default { signMessage };
