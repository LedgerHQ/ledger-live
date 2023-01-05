import Zilliqa from "@ledgerhq/hw-app-zilliqa";
import { log } from "@ledgerhq/logs";

import type { SignMessage, Result } from "../../hw/signMessage/types";
const signMessage: SignMessage = async (
  transport,
  { path, message }
): Promise<Result> => {
  log("debug", "start signMessage process");

  const zilliqa = new Zilliqa(transport);

  if (!message) {
    throw new Error(`Message cannot be empty`);
  }

  const r = await zilliqa.signMessage(path, message as string);

  if (r.signature === null) {
    throw new Error("Failed to sign.");
  }
  return {
    rsv: {
      r: "",
      s: "",
      v: 0,
    },
    signature: `0x${r.signature}`,
  };
};

export default { signMessage };
