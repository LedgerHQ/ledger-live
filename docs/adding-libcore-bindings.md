## Developing with lib-ledger-core bindings

The main C++ libcore library source code is on [LedgerHQ/lib-ledger-core](https://github.com/LedgerHQ/lib-ledger-core).

There are two existing bindings at the moment: [Node.js bindings](https://github.com/LedgerHQ/lib-ledger-core-node-bindings) (NPM: `@ledgerhq/ledger-core`) and [React Native bindings](https://github.com/LedgerHQ/lib-ledger-core-react-native-bindings) (NPM: `@ledgerhq/react-native-ledger-core`).

### 2 bindings, 1 abstraction

The particularity is each bindings expose the libcore through a different API. Node.js bindings have a OO style API and is synchronous where the React Native is asynchronous (defacto because React Native modules architecture) and functional style (where you pass some sort of pointer around to functions instead of having an object with methods).

```js
// Node.js bindings style:
const coreAcc = coreWallet.getAccount(index);
const balance = coreAcc.getBalance();
// React Native bindings style:
const coreAcc = await RNCore.CoreWallet.getAccount(coreWallet, index);
const balance = await RNCore.CoreAccount.getBalance(coreAcc);
```

**To reconciliate the bindings to a same API, live-common implements an abstraction that wrap them into a higher level OO-style asynchronous API:**

```js
// live-common wrapping:
const coreAcc = await coreWallet.getAccount(index);
const balance = await coreAcc.getBalance();
```

Interestingly, it's almost like the Node.js bindings but with awaits.

#### How the wrapping works

The tradeoff to this idea to abstract lib-ledger-core is we need to maintain ourself the typing of that wrapping.

The wrapping are done for each platform (nodejs and react-native) and are implemented in `src/libcore/platforms/*`.

It works by reading some static declaration done in `src/libcore/types.ts` as well as each family specific types in `src/families/*/types.ts` and rebuilding an API with it (proxying each methods into the actual bindings).

### What you need to do to add a new libcore methods or classes?

First of all, the way we can see the libcore API is by looking into this generated pseudo-types: [ledgercore_doc.js](https://github.com/LedgerHQ/lib-ledger-core-node-bindings/blob/master/src/ledgercore_doc.js).

Now, there are two categories of API to add: it's a coin specifics or it's not. If it's a coin specific you will have to modify the bindings of `src/families/<family>/types.ts` (see Bitcoin family for example). If it's not, it's done in `src/libcore/types/index.ts`.

Now, for each of them there are two things you need to essentially do to make the methods/classes available to live-common:

- You need to add it in the FlowType.
- You need to add it in the _reflect_ / `declare()` wrapping logic.

#### Example

Let's look at a generic example, let's say we want to add the method `getAccounts` on the `CoreWallet`.

When looking on [ledgercore_doc.js](https://github.com/LedgerHQ/lib-ledger-core-node-bindings/blob/master/src/ledgercore_doc.js), it looks like this:

```js
declare class NJSWallet {
  declare function getAccounts(offset: number, count: number, callback: NJSAccountListCallback);
}
```

where `NJSAccountListCallback` is actually

```js
declare class NJSAccountListCallback {
  declare function onCallback(result: ?Array<NJSAccount>, error: ?Error);
}
```

essentially you need to rethink this as being:

```js
function getAccounts(offset: number, count: number): NJSAccount[]
```

a function that returns an array of accounts.

Now, to target what our abstraction is, we need to make this API asynchronous as well as rewording things by replacing "NJS" by "Core":

```js
declare class CoreWallet {
  getAccounts(offset: number, count: number): Promise<CoreAccount[]>;
}
```

Well, that's exactly the FlowType what we have defined in `libcore/types/index.ts`!

Now, that we did the FlowType part, we also need to define the methods in the CoreWallet class:

```js
// NB we don't have the "Core" part of the name.
declare("Wallet", {
  methods: {
    getAccounts: {
      returns: ["Account"] // DSL that means "array of accounts"
    },

    ...other methods...
  }
});
```

If the methods accept any parameter that are NOT primitive types (like string or arrays), we also need to describe them. **You can look at other example in the codebase for this**.

Advanced Example:

```js
declare("WalletPool", {
  statics: {
    newInstance: {
      params: [
        null, // it's a primitive type so we don't need to "unwrap" the param
        null,
        "HttpClient",
        "WebSocketClient",
        "PathResolver",
        "LogPrinter",
        "ThreadDispatcher",
        "RandomNumberGenerator",
        "DatabaseBackend",
        "DynamicObject"
      ],
      returns: "WalletPool"
    }
  },
  methods: {
    freshResetAll: {},
    changePassword: {},
    getName: {},
    updateWalletConfig: {
      params: [null, "DynamicObject"]
    },
    getWallet: {
      returns: "Wallet"
    },
    getCurrency: {
      returns: "Currency"
    },
    createWallet: {
      params: [null, "Currency", "DynamicObject"],
      returns: "Wallet"
    }
  }
});
```
