<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

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


[Github](https://github.com/LedgerHQ/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)
