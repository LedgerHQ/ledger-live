import Casper from "@zondax/ledger-casper";
import { log } from "@ledgerhq/logs";

import type { SignMessage, Result } from "../../hw/signMessage/types";
import { getBufferFromString, getPath, isError } from "./utils";

const signMessage: SignMessage = async (
  transport,
  { path, message }
): Promise<Result> => {
  log("debug", "start signMessage process");

  const casper = new Casper(transport);

  if (!message) throw new Error(`Message cannot be empty`);
  if (typeof message !== "string")
    throw new Error(`Signing EIP712Message not supported`);

  const r = await casper.sign(getPath(path), getBufferFromString(message));
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

export default { signMessage };
