<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

## Ledger Stellar app API

## Usage


```js
// when using "@ledgerhq/hw-transport-node-hid" library you need to go to
// Settings -> Browser support in ledger stellar app and set this setting to 'No'
import Transport from "@ledgerhq/hw-transport-node-hid";
// import Transport from "@ledgerhq/hw-transport-u2f"; // for browser
import Str from "@ledgerhq/hw-app-str";
import StellarSdk from "stellar-sdk";

const getStrAppVersion = async () => {
    const transport = await Transport.create();
    const str = new Str(transport);
    const result = await str.getAppConfiguration();
    return result.version;
}
getStrAppVersion().then(v => console.log(v));

const getStrPublicKey = async () => {
  const transport = await Transport.create();
  const str = new Str(transport);
  const result = await str.getPublicKey("44'/148'/0'");
  return result.publicKey;
};
let publicKey;
getStrPublicKey().then(pk => {
    console.log(pk);
    publicKey = pk;
});

const signStrTransaction = async (publicKey) => {
  const transaction = new StellarSdk.TransactionBuilder({accountId: () => publicKey, sequenceNumber: () => '1234', incrementSequenceNumber: () => null})
    .addOperation(StellarSdk.Operation.createAccount({
       source: publicKey,
       destination: 'GBLYVYCCCRYTZTWTWGOMJYKEGQMTH2U3X4R4NUI7CUGIGEJEKYD5S5OJ', // SATIS5GR33FXKM7HVWZ2UQO33GM66TVORZUEF2HPUQ3J7K634CTOAWQ7
       startingBalance: '11.331',
    }))
    .build();
  const transport = await Transport.create();
  const str = new Str(transport);
  const result = await str.signTransaction("44'/148'/0'", transaction.signatureBase());
  
  // add signature to transaction
  const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
  const hint = keyPair.signatureHint();
  const decorated = new StellarSdk.xdr.DecoratedSignature({hint: hint, signature: result.signature});
  transaction.signatures.push(decorated);
  
  return transaction;
}
signStrTransaction(publicKey).then(transaction => console.log(transaction.toEnvelope().toXDR().toString('base64')));
```

---

## Are you adding Ledger support to your software wallet?

You may be using this package to communicate with the Stellar Nano App.

For a smooth and quick integration:

- See the developers’ documentation on the [Developer Portal](https://developers.ledger.com/docs/transport/overview/) and
- Go on [Discord](https://developers.ledger.com/discord-pro/) to chat with developer support and the developer community.

---
