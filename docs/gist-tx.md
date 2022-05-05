# gist: transaction with a Ledger device

We start a new project and add live-common and some helpers

```bash
yarn add @ledgerhq/live-common
yarn add rxjs   # for Observable
```

Now we need an actual implementation of a Transport to use the ledger device with. _In our example we're going to do a Node.js script that works with USB_, so we're just going to install these:

```bash
yarn add @ledgerhq/hw-transport-node-hid-noevents
```

**We're all set up, let's write a script that send some bitcoin!**

```js
const { first, map, reduce, tap } = require("rxjs/operators");
const {
  getCryptoCurrencyById,
  formatCurrencyUnit,
  parseCurrencyUnit,
} = require("@ledgerhq/live-common/lib/currencies");
const {
  getCurrencyBridge,
  getAccountBridge,
} = require("@ledgerhq/live-common/lib/bridge");

// our small example is a script that takes 3 params.
// example: node send.ts bitcoin bc1abc..def 0.001
if (!process.argv[4]) {
  console.log(`Usage: currencyId recipient amount`);
  process.exit(1);
}
const currencyId = process.argv[2];
const currency = getCryptoCurrencyById(currencyId);
const recipient = process.argv[3];
const amount = parseCurrencyUnit(currency.units[0], process.argv[4]);
const deviceId = ""; // in HID case

//////////////////////////////////
// live-common requires some setup. usually we put that in a live-common-setup.js

const { registerTransportModule } = require("@ledgerhq/live-common/lib/hw");
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid-noevents")
  .default;
const {
  setSupportedCurrencies,
} = require("@ledgerhq/live-common/lib/currencies");

// configure which coins to enable
setSupportedCurrencies([currencyId]);

// configure which transport are available
registerTransportModule({
  id: "hid",
  open: (devicePath) => TransportNodeHid.open(devicePath),
  disconnect: () => Promise.resolve(),
});

/////////////////////////

async function main() {
  // currency bridge is the interface to scan accounts of the device
  const currencyBridge = getCurrencyBridge(currency);

  // some currency requires some data to be loaded (today it's not highly used but will be more and more)
  const data = await currencyBridge.preload(currency);
  if (data) {
    currencyBridge.hydrate(currency, data);
  }

  // in our case, we don't need to paginate
  const syncConfig = { paginationConfig: {} };

  // NB scanAccountsOnDevice returns an observable but we'll just get the first account as a promise.
  const scannedAccount = await currencyBridge
    .scanAccounts({ currency, deviceId, syncConfig })
    .pipe(
      // there can be many accounts, for sake of example we take first non empty
      first((e) => e.type === "discovered" && e.account.balance.gt(0)),
      map((e) => e.account)
    )
    .toPromise();

  // account bridge is the interface to sync and do transaction on our account
  const accountBridge = getAccountBridge(scannedAccount);

  // Minimal way to synchronize an account.
  // NB: our scannedAccount is already sync in fact, this is just for the example
  const account = await accountBridge
    .sync(scannedAccount, syncConfig)
    .pipe(reduce((a, f) => f(a), scannedAccount))
    .toPromise();

  console.log(`${account.name} new address: ${account.freshAddress}`);
  console.log(
    `with balance of ${formatCurrencyUnit(account.unit, account.balance)}`
  );

  // We prepare a transaction
  let t = accountBridge.createTransaction(account);
  t = accountBridge.updateTransaction(t, { amount, recipient });
  t = await accountBridge.prepareTransaction(account, t);

  // We can always get the status. used for form validation and meta info (like calculated fees)
  const status = await accountBridge.getTransactionStatus(account, t);
  console.log({ status });

  // we can't broadcast the transaction if there are errors
  const errors = Object.values(status.errors);
  if (errors.length) {
    throw errors[0];
  }

  // We're good now, we can sign the transaction with the device
  const signedOperation = await accountBridge
    .signOperation({ account, transaction: t, deviceId })
    .pipe(
      tap((e) => console.log(e)), // log events
      // there are many events. we just take the final signed
      first((e) => e.type === "signed"),
      map((e) => e.signedOperation)
    )
    .toPromise();

  // We can then broadcast it
  const operation = await accountBridge.broadcast({ account, signedOperation });

  // the transaction is broadcasted!
  // the resulting operation is an "optimistic" response that can be prepended to our account.operations[]
  console.log("broadcasted", operation);
}

main();
```
