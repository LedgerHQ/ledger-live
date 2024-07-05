import { DefaultKeyringEth } from "../src/DefaultKeyringEth";
import AppBinding from "@ledgerhq/hw-app-eth";
import TransportNodeHid from "../../hw-transport-node-hid/src/TransportNodeHid";
import { DefaultContextModule } from "@ledgerhq/context-module";

const message = process.argv[2];

console.log(`message: ${message}`);

(async () => {
  const transport = await TransportNodeHid.create(100, 1000);
  const appBinding = new AppBinding(transport);
  const contextModule = new DefaultContextModule({ loaders: [] });
  const keyring = new DefaultKeyringEth(appBinding, contextModule);

  const result = await keyring.signMessage("44'/60'/0'/0/0", message, { method: "personalSign" });
  console.log(result);
})();
