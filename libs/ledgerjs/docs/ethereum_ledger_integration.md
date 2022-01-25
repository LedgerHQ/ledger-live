# How to integrate the Ledger device with a Ethereum Web Application

This is a quick guide to show how to integrate Ledger Ethereum libraries into an existing web application.

If you are starting a new DApp project from scratch, or simply are beginning in this Ethereum Smart Contract world, we have made [`create-dapp` **Starter Kit**](https://www.npmjs.com/package/create-dapp) for you, it comes with a out-of-the-box support of Ledger and MetaMask and shows a complete smart contract example (that allows to get/set a value globally).

Whether you want to integrate on an existing app or bootstrap it from scratch with our starter kit, the follow guide will drive you to important part on how things work with the Ledger.

## Prerequisites of the guide

* you have experience in JavaScript and a setup for ES6 / Babel. see https://babeljs.io/
* You have a Ledger Device and know how to use it. See our guides: https://support.ledgerwallet.com

## Important checklist

* On the Ledger device, you need to open the **Ethereum app** (available by default, install it with the Ledger Manager otherwise).
* For web app that run in browser:
  * **You need your webapp to run in HTTPS**: the ledger device uses U2F API that requires you to run. It will also only work in Chrome and Safari currently (but Firefox is on its way on implementing U2F, you can still try the Firefox U2F extension)
  * set **Browser Support** to **Yes** in Settings of the Eth app.
* For a smart contract, you will also need to set **Contract data** to **Yes** in Settings of the Eth app.

## gist of an integration with Web3.js

```js
import Web3 from "web3";
import ProviderEngine from "web3-provider-engine";
import FetchSubprovider from "web3-provider-engine/subproviders/fetch";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";

const rpcUrl = "http://127.0.0.1:8545";
const networkId = 1337;

function createWeb3() {
  const engine = new ProviderEngine();
  const getTransport = () => TransportU2F.create();
  const ledger = createLedgerSubprovider(getTransport, {
    networkId,
    accountsLength: 5
  });
  engine.addProvider(ledger);
  engine.addProvider(new FetchSubprovider({ rpcUrl }));
  engine.start();
  return new Web3(engine);
}
```

### Libraries

There are 2 libraries you will probably need for your project, one is `web3` that implements a common interface to deal with Ethereum network and the other is `web3-provider-engine` (from MetaMask) because it provides building blocks to combine different providers (in our example the Ledger with a RPC API).

```js
import Web3 from "web3";
import ProviderEngine from "web3-provider-engine";
import FetchSubprovider from "web3-provider-engine/subproviders/fetch";
```

Now, you can use the `@ledgerhq/web3-subprovider` library that implements a subprovider for `web3-provider-engine`. We'll also need a "transport", in our case it will be U2F:

```js
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
```

### Configuration

There are basically 2 configurations to use a Ethereum network: One is the endpoint (the `rpcUrl`, for instance `https://mainnet.infura.io`) and the other is the "network id" (for instance Ethereum mainnet is `1`, Ethereum Robsten testnet is `3`)

If you use a tool like **ganache** to create a development Ethereum network, it will generally run on `localhost:8545` and you will have a `networkId`. We recommend you set it yourself with `ganache-cli --networkId 1337` because we will need it as a configuration.

```js
const rpcUrl = "http://127.0.0.1:8545";
const networkId = 1337;
```

**you can also directly use testnet. It's quite easy to setup:**

```js
const rpcUrl = "https://ropsten.infura.io/";
const networkId = 3;
```

### creating a web3 instance

```js
function createWeb3() {
  const engine = new ProviderEngine();
  const getTransport = () => TransportU2F.create();
  const ledger = createLedgerSubprovider(getTransport, {
    networkId,
    accountsLength: 5
  });
  engine.addProvider(ledger);
  engine.addProvider(new FetchSubprovider({ rpcUrl }));
  engine.start();
  return new Web3(engine);
}
```

`createLedgerSubprovider` have some options:

```js
{
  // refer to https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
  networkId: number,
  // derivation path
  path?: string,
  // should use actively validate on the device
  askConfirm?: boolean,
  // number of accounts to derivate
  accountsLength?: number,
  // offset index to use to start derivating the accounts
  accountsOffset?: number
}
```

The `accountsLength` allows to ask how much accounts we want to retrieve when doing `web3.getAccounts`

Once you have created your `web3` instance, you can use it like in any Ethereum app: this is beyond the scope of this guide but feel free to checkout our starter kit that have a full example of that.

## Vanilla signing a transaction

There is also a way to interoperate with the Ledger device without using web3. Basically if you can have the Transaction hex that you want to sign on the device.

```js
import AppEth from "@ledgerhq/hw-app-eth";
import TransportU2F from "@ledgerhq/hw-transport-u2f";

async function signTransaction(txHex) {
  await transport = TransportU2F.create();
  const result = await eth.signTransaction(
    "44'/60'", // path to use for the derivation
    txHex
  );
  return result;
}
```

This is for more advanced usage only as it's way more low level. You might want to checkout our `@ledgerhq/web3-subprovider` implementation as well as the usage of `ethereumjs-tx` to help you out.

## Conclusion

This guide was focused on Web and U2F, but we also have support for **Node.js** and **React Native**, so if you want to go there, you might just replace "TransportU2F" / "transport-u2f" by any of the relevant Transport, find more on https://github.com/LedgerHQ/ledgerjs .
**Typically, if you write an Electron app**, you should use `@ledgerhq/hw-transport-node-hid` instead of U2F.
In the future, we might also see web-usb and web-bluetooth technologies emerging, how cool will that be?

Have fun experimenting things with the Ledger, can't wait to see all the new Ethereum applications shipped in the future.
