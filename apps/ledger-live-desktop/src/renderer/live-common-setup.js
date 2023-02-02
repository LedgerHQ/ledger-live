// @flow
import "../live-common-setup";
import { setBridgeProxy } from "@ledgerhq/live-common/bridge/index";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { setSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/wallet-btc/crypto/secp256k1";
import { retry } from "@ledgerhq/live-common/promise";
import { getUserId } from "~/helpers/user";
import { getAccountBridge, getCurrencyBridge } from "./bridge/proxy";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";
import { command } from "./commands";

setEnvOnAllThreads("USER_ID", getUserId());

setBridgeProxy({ getAccountBridge, getCurrencyBridge });

registerTransportModule({
  id: "ipc",
  open: id => {
    // Should we return the transport if already open or return an error ?
    return retry(() => IPCTransport.open(id));
  },
  disconnect: () => {
    return Promise.resolve();
  },
});

setSecp256k1Instance({
  async publicKeyTweakAdd(publicKey, tweak) {
    const r = await command("publicKeyTweakAdd")({
      publicKey: Buffer.from(publicKey).toString("hex"),
      tweak: Buffer.from(tweak).toString("hex"),
    }).toPromise();
    return new Uint8Array(Buffer.from(r, "hex").toJSON().data);
  },
});
