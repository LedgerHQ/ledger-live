import { log } from "@ledgerhq/logs";
import { TonTransport } from "@ton-community/ton-ledger";

import type { Resolver } from "../../hw/getAddress/types";
import { getLedgerTonPath } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "[ton] start getAddress");

  const app = new TonTransport(transport);
  const ledgerPath = getLedgerTonPath(path);

  const { publicKey, address } = verify
    ? await app.validateAddress(ledgerPath, { bounceable: false })
    : await app.getAddress(ledgerPath, { bounceable: false });

  if (!address || !publicKey.length) throw Error(`[ton] Response is empty ${address} ${publicKey}`);

  return { path, publicKey: publicKey.toString("hex"), address };
};

export default resolver;
