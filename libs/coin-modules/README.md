# Coin Modules
## Alpaca compatibility
### Architectural Decision
__A CoinModule has the following directories/modules:__
* `api`: interface for exposing the CoinModule to a backend service (a.k.a. Alpaca)
* `bridge`: implementation of Bridges interface (cf. [Bridge](light-sync))
* `logic`: contains all core logic of the blockchain. The code here is agnostic of all external interface (i.e. Bridge or Api) and relies only on external libs and `network` directory
* `network`: communication logic with explorer/index/node (cf. [How to wrap you api](light-sync#wrap-your-api))
* `signer`: defines the interface definition to the Embedded App and the logic to retrieve [derive address](addrss-derivation)
* `types`: all different model definitions, except for `network`

==> With this organisation, it is more obvious and consistent where to find and create new functions/files.

__The model types has to follow those rules:__
* `network` types are defined in its module.
* `network` types can only be used within its module.
* `logic` types are defined in `types` module
* `logic` types can be used within in any module (except `network` due to it voluntary "lack" of visibility)
* `bridge` types are defined in `types` module
* `bridge` types can only be used within its module
* `api` types are defined in `types` module
* `api` types can only be used within its module

==> By creating this separation, we avoid any colision between Bridge types (a.k.a. Live types) in Alpaca interface and vice versa.

__Network calls:__
`network` functions should only be accessed through the `logic` module. *This is an on-going effort*.

==> By creating this layer, we enforce the consistency between `bridge` behaviour and `api` behaviour.

### Status
List of CoinModule compatible with Alpaca:
* Polkadot
* Stellar
* Tezos
* Xrp
