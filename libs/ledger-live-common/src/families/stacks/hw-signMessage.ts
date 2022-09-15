import BlockstackApp from "@zondax/ledger-stacks";

import type { SignMessage, Result } from "../../hw/signMessage/types";
import { getBufferFromString, getPath, isError } from "./utils";

const signMessage: SignMessage = async (
  transport,
  { path, message }
): Promise<Result> => {
  //log("debug", "start signMessage process");

  const blockstack = new BlockstackApp(transport);

  if (!message) throw new Error(`Message cannot be empty`);

  const r = await blockstack.sign(getPath(path), getBufferFromString(message));
  isError(r);

  return {
    rsv: {
      r: r.signatureCompact.slice(0, 32).toString("hex"),
      s: r.signatureCompact.slice(32, 64).toString("hex"),
      v: parseInt(r.signatureCompact.slice(64, 65).toString("hex"), 16),
    },
    signature: `0x${r.signatureVRS.toString("hex")}`,
  };
};

export default { signMessage };
