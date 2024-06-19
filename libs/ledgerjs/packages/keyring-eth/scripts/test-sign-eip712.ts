import { DefaultKeyringEth } from "../src/DefaultKeyringEth";
import AppBinding from "@ledgerhq/hw-app-eth";
import TransportNodeHid from "../../hw-transport-node-hid/src/TransportNodeHid";
import { DefaultContextModule } from "@ledgerhq/context-module";
import { EIP712Message } from "@ledgerhq/types-live";

const isEIP712 = (eip712: EIP712Message): eip712 is EIP712Message => {
  try {
    return (
      typeof eip712 === "object" &&
      eip712 !== null &&
      eip712.domain !== undefined &&
      eip712.types !== undefined &&
      eip712.primaryType !== undefined &&
      eip712.message !== undefined
    );
  } catch {
    return false;
  }
};

const message = process.argv[2];
const eip712 = JSON.parse(message);

if (!isEIP712(eip712)) {
  console.error("Invalid EIP712 message");
  process.exit(1);
}

console.log(`message: ${JSON.stringify(eip712)}`);

(async () => {
  const transport = await TransportNodeHid.create(100, 1000);
  const appBinding = new AppBinding(transport);
  const contextModule = new DefaultContextModule({ loaders: [] });
  const keyring = new DefaultKeyringEth(appBinding, contextModule);

  const result = await keyring.signMessage("44'/60'/0'/0/0", eip712, { method: "eip712" });
  console.log(result);
})();
