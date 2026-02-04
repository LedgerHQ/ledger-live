Coin Modules
============

Alpaca compatibility
--------------------

### Architectural Decision
The following concepts are mandatory for a CoinModule to be *Alpaca compliant*.
#### A CoinModule has the following directories/modules
* `api`: interface for exposing the CoinModule to a backend service (a.k.a. Alpaca)
* `logic`: contains all core logic of the blockchain. The code here is agnostic of all external interface (i.e. Bridge or Api) and relies only on external libs and `network` directory
* `network`: communication logic with explorer/index/node
* `types`: all different model definitions, except for `network`
* `config.ts`: exposes methods to update and fetch the coin config
* `transaction.ts`: exposes serialization utils
* `supportedFeatures.ts` (to be refined): exposes the set of features available within the Alpaca API
* `bridge` (legacy): implementation of Bridges interface (cf. [Bridge](https://github.com/LedgerHQ/ledger-live/blob/25c9bc5fc4276e8a2268c81a334776ec927e495e/libs/ledgerjs/packages/types-live/src/bridge.ts#L96-L105))
* `signer` (legacy): defines the interface definition to the Embedded App and the logic to retrieve

**==> With this organisation, it is more obvious and consistent where to find and create new functions/files.**

#### The model types has to follow those rules
* `network` types are defined in its module.
* `network` types can only be used within its module.
* `logic` types are defined in `types` module
* `logic` types can be used within in any module (except `network` due to it voluntary "lack" of visibility)
* `bridge` types are defined in `types` module
* `bridge` types can only be used within its module
* `api` types are defined in `types` module
* `api` types can only be used within its module

**==> By creating this separation, we avoid any colision between Bridge types (a.k.a. Live types) in Alpaca interface and vice versa.**

#### Network calls
`network` functions should only be accessed through the `logic` module. *This is an on-going effort*.

**==> By creating this layer, we enforce the consistency between `bridge` behaviour and `api` behaviour.**

### Status
List of CoinModule compatible with Alpaca on [Confluence](https://ledgerhq.atlassian.net/wiki/spaces/WALLETCO/pages/6129025043/Coin+Modules+Developments+Mapping)
