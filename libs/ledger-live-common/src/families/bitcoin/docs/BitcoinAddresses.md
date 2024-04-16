# Introduction to Bitcoin Family Addresses, Derivation Paths, and Output Scripts

## Bitcoin Family Currencies in Ledger Live
In Ledger Live, the Bitcoin family includes the following cryptocurrencies:
- Bitcoin
- Bitcoin Cash
- Litecoin
- DigiByte
- Zcash (ZEC)
- Horizen (ZEN)
- Dash
- Peercoin
- Komodo
- PIVX
- Stealth
- Bitcoin Gold
- Dogecoin (DOGE)
- Qtum
- Vertcoin (VTC)
- Viacoin (VIA)
- Decred

## Derivation Paths
Each account in Ledger Live has a derivation path formatted as `m / purpose' / coin_type' / account' / change`.(BIP44) The `purpose` is determined by the derivation mode: 44 for legacy addresses, 49 for segwit, 84 for native segwit, and 86 for taproot.

`coin_type` is a fixed value for each coin, for example:
- Bitcoin: 0
- Bitcoin Cash: 145
- Litecoin: 2
- Dogecoin: 3
- Qtum: 2301
- Vertcoin: 28
- Viacoin: 14
- Decred: 42

For a detailed list, see [SLIP-0044](https://github.com/satoshilabs/slips/blob/master/slip-0044.md).

`account` is the index of the account, starting from 0 for the first account created in Ledger Live, 1 for the second, and so on. `change` is either 0 or 1, where 0 represents receiving addresses and 1 represents change addresses.

Addresses for each account continue to derive with an increasing index, starting from 0. For example:
- The first receiving address of a legacy Bitcoin account is `m/44'/0'/0'/0/0`, the second is `m/44'/0'/0'/0/1`, and so on.
- The first change address of a native segwit Bitcoin account is `m/84'/0'/0'/1/0`, the second is `m/84'/0'/0'/1/1`, and so on.

In Ledger Live, the part `m / purpose' / coin_type' / account'` of the derivation path combined with the seed in hardware can generate an `xpub` (i.e. extended public key). (The generation of xpub is implemented in `getWalletXpub` method in hw-btc-app. It requires the connection with nano device via APDU) 
Based on that `xpub`, all addresses can be derived on ledger-live side. This is implemented in `wallet-btc/crypto`. Each currency is a class inheriting from `"class Base"`, for instance, Bitcoin's class is `"class Bitcoin extends Base"`. The Base class has a method `getAddress()`, which, given an `xpub` and derivation mode along with the last two levels of index, can generate a Bitcoin address.

### Example
For the first legacy Bitcoin account, the address is calculated as follows:
- Compute the address corresponding to the derivation path `m/44'/0'/0'/x/y` by using the function `getAddress(derivationMode: string, xpub: string, account: number, index: number)`, where `derivationMode` is `"legacy"`, `xpub` is the xpub of the first legacy Bitcoin account, `account` is `x`, and `index` is `y`.

Most Bitcoin family currencies use the same method to calculate addresses, differing only in their blockchain network parameters. However, some have entirely different address derivation algorithms, such as Bitcoin's taproot derivation mode and Decred, which uses the blake256 algorithm for address generation. These special calculation methods are implemented in the `customGetAddress()` method in their respective classes. Additionally, address derivation algorithms based on secp256k1 are computationally intensive, so we use caching to improve performance by reusing intermediate results. Moreover, in order to improve performance, we use different secp256k1 libs in LLM/LLD. (`import secp256k1 from "secp256k1"` for LLD and `import { secp256k1 } from "react-native-fast-crypto"` for LLM)

## Output Scripts
Each transaction output in Bitcoin consists of two parts: the amount of bitcoin to be transferred and an output script (also known as "scriptPubKey"). The output script sets the conditions under which the amount can be spent. It is a crucial part of Bitcoin's scripting system, ensuring that only the rightful owner can spend the bitcoins, usually by solving a cryptographic puzzle that only the owner's private key can solve. 

In our codebase, the `toOutputScript()` method in `base.ts`, with the help of `bitcoinjs-lib`, generates the output script for a given address for most currencies in the Bitcoin family. Special cases, such as Decred, which uses the blake256 algorithm for address generation, have their output scripts generated using the same algorithm; this implementation can be found in `decred.ts`. The output script is then included in the transaction's output when building a transaction.
