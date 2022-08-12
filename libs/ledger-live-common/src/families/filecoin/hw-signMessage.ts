import Fil from "@zondax/ledger-filecoin";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import type {
  MessageData,
  SignMessage,
  Result,
} from "../../hw/signMessage/types";
import { getBufferFromString, getPath, isError } from "./utils";

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

const signMessage: SignMessage = async (
  transport,
  { path, message }
): Promise<Result> => {
  log("debug", "start signMessage process");

  const fil = new Fil(transport);

  if (!message) throw new Error(`Message cannot be empty`);

  const r = await fil.sign(getPath(path), getBufferFromString(message));
  isError(r);

  return {
    rsv: {
      r: r.signature_compact.slice(0, 32).toString("hex"),
      s: r.signature_compact.slice(32, 64).toString("hex"),
      v: parseInt(r.signature_compact.slice(64, 65).toString("hex"), 16),
    },
    signature: `0x${r.signature_compact.toString("hex")}`,
  };
};

export default { prepareMessageToSign, signMessage };
