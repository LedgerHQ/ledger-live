import { log } from "@ledgerhq/logs";
import { TonTransport } from "@ton-community/ton-ledger";

import type { Result, SignMessage } from "../../hw/signMessage/types";
import { getLedgerTonPath } from "./utils";

const signMessage: SignMessage = async (transport, account, { message }): Promise<Result> => {
  log("debug", "[ton] start signMessage process");

  const app = new TonTransport(transport);
  const ledgerPath = getLedgerTonPath(account.freshAddressPath);

  if (!message) throw new Error("Message cannot be empty");
  if (typeof message !== "string") throw new Error("Message must be a string");

  const parsedMessage = JSON.parse(message);

  const r = await app.signTransaction(ledgerPath, parsedMessage);

  return {
    rsv: {
      r: "",
      s: "",
      v: 0,
    },
    signature: r.toString(),
  };
};

export default { signMessage };
