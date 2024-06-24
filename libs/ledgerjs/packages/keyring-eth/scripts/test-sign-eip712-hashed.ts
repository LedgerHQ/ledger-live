import { DefaultKeyringEth } from "../src/DefaultKeyringEth";
import AppBinding from "@ledgerhq/hw-app-eth";
import TransportNodeHid from "../../hw-transport-node-hid/src/TransportNodeHid";
import { DefaultContextModule } from "@ledgerhq/context-module";
import { EIP712Params } from "../src/KeyringEth";

const isEIP712Params = (params: EIP712Params): params is EIP712Params => {
  try {
    return (
      typeof params === "object" &&
      params !== null &&
      params.domainSeparator !== undefined &&
      params.hashStruct !== undefined
    );
  } catch {
    return false;
  }
};

const message = process.argv[2];
const eip712Hashed = JSON.parse(message);

if (!isEIP712Params(eip712Hashed)) {
  console.error("Invalid EIP712 message");
  process.exit(1);
}

console.log(`message: ${JSON.stringify(eip712Hashed)}`);

(async () => {
  const transport = await TransportNodeHid.create(100, 1000);
  const appBinding = new AppBinding(transport);
  const contextModule = new DefaultContextModule({ loaders: [] });
  const keyring = new DefaultKeyringEth(appBinding, contextModule);

  const result = await keyring.signMessage("44'/60'/0'/0/0", eip712Hashed, {
    method: "eip712Hashed",
  });
  console.log(result);
})();
