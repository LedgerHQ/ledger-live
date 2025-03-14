<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

[GitHub](https://github.com/LedgerHQ/ledger-live/),
[Ledger Devs Discord](https://developers.ledger.com/discord-pro),
[Developer Portal](https://developers.ledger.com/)

## @ledgerhq/hw-app-aptos

Ledger Hardware Wallet Aptos JavaScript bindings.

***

## Are you adding Ledger support to your software wallet?

You may be using this package to communicate with the Aptos Nano App.

For a smooth and quick integration:

*   See the developers’ documentation on the [Developer Portal](https://developers.ledger.com/docs/transport/overview/) and
*   Go on [Discord](https://developers.ledger.com/discord-pro/) to chat with developer support and the developer community.

***

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

*   [Aptos](#aptos)
    *   [Parameters](#parameters)
    *   [Examples](#examples)
    *   [getAddress](#getaddress)
        *   [Parameters](#parameters-1)
        *   [Examples](#examples-1)
    *   [signTransaction](#signtransaction)
        *   [Parameters](#parameters-2)
        *   [Examples](#examples-2)
*   [bippath](#bippath)

### Aptos

Aptos API

#### Parameters

*   `transport` **Transport**&#x20;
*   `scrambleKey`   (optional, default `"aptos"`)

#### Examples

```javascript
import Transport from "@ledgerhq/hw-transport";
import Aptos from "@ledgerhq/hw-app-aptos";

function establishConnection() {
    return Transport.create()
        .then(transport => new Aptos(transport));
}

function fetchAddress(aptosClient) {
    return aptosClient.getAddress("44'/144'/0'/0/0");
}

function signTransaction(aptosClient, deviceData, seqNo, buffer) { *
    const transactionBlob = encode(buffer);

    console.log('Sending transaction to device for approval...');
    return aptosClient.signTransaction("44'/144'/0'/0/0", transactionBlob);
}

function prepareAndSign(aptosClient, seqNo) {
    return fetchAddress(aptosClient)
        .then(deviceData => signTransaction(aptosClient, deviceData, seqNo));
}

establishConnection()
    .then(aptos => prepareAndSign(aptos, 123, payload))
    .then(signature => console.log(`Signature: ${signature}`))
    .catch(e => console.log(`An error occurred (${e.message})`));
```

#### getAddress

get Aptos address for a given BIP 32 path.

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in BIP 32 format
*   `display`  optionally enable or not the display (optional, default `false`)

##### Examples

```javascript
const result = await aptos.getAddress("44'/144'/0'/0/0");
const { publicKey, address } = result;
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<AddressData>** an object with a publicKey, address and (optionally) chainCode

#### signTransaction

sign a Aptos transaction with a given BIP 32 path

##### Parameters

*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path in BIP 32 format
*   `txBuffer` **[Buffer](https://nodejs.org/api/buffer.html)** the buffer to be signed for transaction

##### Examples

```javascript
const signature = await aptos.signTransaction("44'/144'/0'/0/0", "12000022800000002400000002614000000001315D3468400000000000000C73210324E5F600B52BB3D9246D49C4AB1722BA7F32B7A3E4F9F2B8A1A28B9118CC36C48114F31B152151B6F42C1D61FE4139D34B424C8647D183142ECFC1831F6E979C6DA907E88B1CAD602DB59E2F");
```

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<{signature: [Buffer](https://nodejs.org/api/buffer.html)}>** a signature as hex string

### bippath

BIP32 Path Handling for Aptos Wallets

This file provides utility functions to handle BIP32 paths,
which are commonly used in hierarchical deterministic (HD) wallets.
It includes functions to convert BIP32 paths to and from different formats,
extract components from extended public keys (xpubs), and manipulate path elements.
