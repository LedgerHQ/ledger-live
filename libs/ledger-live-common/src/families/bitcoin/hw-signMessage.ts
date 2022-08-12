import Btc from "@ledgerhq/hw-app-btc";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { MessageData, SignMessage } from "../../hw/signMessage/types";
import type { DerivationMode } from "../../derivation";

export const prepareMessageToSign = (
  currency: CryptoCurrency,
  path: string,
  derivationMode: DerivationMode,
  message: string
): MessageData => {
  return {
    currency,
    path,
    derivationMode: derivationMode as DerivationMode,
    message: Buffer.from(message, "hex").toString(),
    rawMessage: "0x" + message,
  };
};

const signMessage: SignMessage = async (transport, { path, message }) => {
  const btc = new Btc(transport);
  const hexMessage = Buffer.from(message).toString("hex");
  const result = await btc.signMessageNew(path, hexMessage);
  const v = result["v"] + 27 + 4;
  const signature = Buffer.from(
    `${v.toString(16)}${result["r"]}${result["s"]}`,
    "hex"
  ).toString("base64");
  return {
    rsv: result,
    signature,
  };
};

export default { prepareMessageToSign, signMessage };
