import { Transaction, ethers } from "ethers";
import { DefaultKeyringEth } from "../src/DefaultKeyringEth";
import AppBinding from "@ledgerhq/hw-app-eth";
import TransportNodeHid from "../../hw-transport-node-hid/src/TransportNodeHid";
import { DefaultContextModule } from "@ledgerhq/context-module";
import { SignTransactionOptions } from "../src/KeyringEth";
import dotenv from "dotenv";

dotenv.config();

const provider = process.env.KEYRING_ETH_PROVIDER;

if (!provider) {
  console.error("Please provide KEYRING_ETH_PROVIDER");
  process.exit(1);
}

const hash = process.argv[2];
const domain = process.argv?.[3];

const options: SignTransactionOptions = domain
  ? {
      forwardDomain: { domain, registry: "ens" },
    }
  : {};

console.log(`transaction hash: ${hash} on provider: ${provider}`);

const unsignTransaction = (transaction: Transaction) => {
  const { chainId, data, gasLimit, gasPrice, nonce, to, value } = transaction;
  return {
    chainId,
    data,
    gasLimit,
    gasPrice,
    nonce,
    to: to?.toLowerCase(),
    value,
  };
};

(async () => {
  const rpc = new ethers.providers.JsonRpcProvider(provider);
  const transaction = await rpc.getTransaction(hash);
  const unsignedTransaction = unsignTransaction(transaction);

  const transport = await TransportNodeHid.create(100, 1000);
  const appBinding = new AppBinding(transport);
  const contextModule = new DefaultContextModule(undefined);
  const keyring = new DefaultKeyringEth(appBinding, contextModule);

  const result = await keyring.signTransaction("44'/60'/0'/0/0", unsignedTransaction, options);
  console.log(result);
})();
