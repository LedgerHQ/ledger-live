# derivation – BIP44 and exceptions

Our hardware wallet uses [Bitcoin specification BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) that specifies a deterministic way to generate public and private keys from a 12/18/24 words seed.

[BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) defines a hierarchical way to deterministically generate these _("HD wallets" for hierarchical deterministic wallets)_. We use the wording "**derivation**" to describe this generation. To **derive** addresses in a hierarchical way, we use a **derivation path** separated by `/`. For instance `0/1/2/3/4`. Now that specification also describe two possible feature of each component of that path: either it's hardened or it's not. When it's hardened, we add a `'` suffix in the path. So for instance `44'/0'/0'/0/0` starts with hardened path `44'/0'/0'` and terminate with non hardened `0/0`.

**hardened** essentially means that someone can't guess the keys from the parent path unless actively deriving them. So in our previous example, it essentially means that by knowning `44'/0'/0'` I can programmatically derive (without the device nor the top level seed) all possible addresses under that path (so for instance `44'/0'/0'/0/0`, `44'/0'/0'/0/1`,...)

But by knowing `44'/0'` I will never be able to determine `44'/0'/0'` (which is still hardened) without the original seed (and therefore the hardware wallet device)

## BIP 44

There are a virtually infinite number of addresses that can be derived from a seed.
It is therefore important to follow a same convention (or at least minimize the number of conventions taken), to enforce interoperability between different wallet solutions.

One of the biggest specification is [BIP 44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) which define the general pattern of address derivations but also describe a fondamental concept of Account.

Essentially what the spec is saying is that all address should be derived at

```
purpose' / coin_type' / account' / change / address_index
```

where

- `purpose` will be 44 for legacy, 49 for segwit and 84 for native segwit.
- `coin_type` is a number unique per crypto currency and specified in [SLIP 44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md). Typically, Bitcoin is `0`.
- `account` is the index of the account
- `change` and `address_index` are ways to generate new addresses inside the account. This follow a strict rule described in the spec (with the importance of the Gap limit)

So a typical derivation is

```
44'/0'/0'/0/0
```

which correspond to the first address of the first Bitcoin legacy account.

**There is a very important specification in BIP 44:** when a client (like Ledger Live / live-common) will search for accounts, it needs to start from account=0 and increment account until finding an empty account. By empty, it means an account without transaction received on its addresses (with respect to Gap limit).

So for instance, if `44'/0'/0'/0/0` is empty, by following the spec, it's assumed that no addressed under the `44'/0'/0'` account has been filled with transaction: the account is considered empty and it's therefore the only available Bitcoin Legacy account that should be exposed to the user. In other words, allowing the user to create the account `44'/0'/1'` would be considered illegal regarding this spec.

This is a strict limit that allows the scanning algorithm that search for accounts to terminate.

Now, for Bitcoin, we have more than one "purpose": there were important upgrades in how to format addresses and make transactions on the Bitcoin network that required to move to a fundamentally different account: this is why Segwit accounts are going to be on `49'/0'/account'` and Native Segwit are going to be on `84'/0'/account'`.

In live-common, and for Bitcoin, we will scan for at least these 3 differents derivation schemes (that we call "DerivationMode").

This create the following flow:

![](excalidraw-btc-scan-accounts.png)

## Recovering from the past mistakes

There are a few reason we need to add more "derivation schemes" to our scanning logic, mostly because user mistake OR wallet developer mistakes.

Sadly, not every wallet complies to BIP 44 and following strict conventions. You see a lot of wallet that directly ask the user to input a derivation path. It's both a bad UX for the user and it's not responsible for our community because it does not prevent our users to create accounts in weird path and forget about these (or then use wallet that are not compatible with these). It's our crypto community responsability to enforce convention that allow any user to recover accounts in a limited amount of time and whatever wallet they are using.

We have over the time added many exceptions to handle these mistakes.

For instance, for ethereum, we will scan for addresses at `44'/60'/0'/x` and will iterate the x until we have seen 10 (and not 1) empty accounts. This is a heuristic driven by the fact MyEthereumWallet ask the user to pick an address among PAGES of addresses and do not enforce to pick the first one 🤷‍♂️. as it's pages of 5, we used 10 to handle the most extreme case where you would take the first address of page 1 and last address of page 2...

It can be very challenging to reconciliate the real world mistakes back into a well specified derivation. We can solve it with our current approach to an extend, if a user is stuck in a specific path and want to use Ledger Live, he will have to move out the funds to a better path (using the original tool he used to derives address in the first place).

**When we integrate a new coin, we will always to try to converge the existing approaches to the most common used paradigm and will always prefer BIP 44 when possible.** Sometimes we support more than one, for instance when we integrated Tezos there where both tezbox and galleon that had different _default_ derivation, we found a way to scan for both.

All exceptions are written in [src/derivation.ts](../src/derivation.ts).

## DerivationMode ?

derivation.ts exposes a type called `DerivationMode`. It's essentially an enum string of all possible derivation schemes.

By convention we use `""` to describe the legacy 44 purpose. (it's essentially the "default"). Otherwise we have `"segwit"` and `"native_segwit"`, but many more.

The DerivationMode is used for many things and is part of the Account information. (it's contained in the account `id`)

Most of the functions that are exposed by derivation.ts will take a DerivationMode in parameter.

## getDerivationModesForCurrency

The starting point of derivation.ts is essentially `getDerivationModesForCurrency`. This function is used by the `bridge.scanAccounts` logic to know where to derive accounts. It gives for a given crypto currency the array of "DerivationMode" to scan for.

So for instance, for Bitcoin we described there were 3 classical cases, that function would just return `[ "", "segwit", "native_segwit" ]`.

We have however also the concept of "legacy" derivations. In case of Bitcoin, we also will prepend a `"legacy_on_bch"` which are to recover a common case of people sending Bitcoin to Bitcoin Cash addresses.

We have also some special "custom" accounts (by enabling _Experimental Settings > Extended account search_) that would enable more derivation modes:

```
[ "legacy_on_bch", "segwit_on_legacy", "legacy_on_segwit", "", "segwit", "native_segwit" ]
```

`segwit_on_legacy` and `legacy_on_segwit` are ways to recover from classical user mistake of having sent funds on a Segwit addressed derived on a legacy account, or reversely. That way allows these users to create (in advanced mode way) the accounts to recover the funds.

The returned values differ for each coin, because some coins supports segwit some don't, same for native segwit. Some coins also are **hard fork of Bitcoin** which force us to support a special derivation (we called `"unsplit"`, because it's the derivation path before splitting the funds out of the parent derivation path).

`""` defacto means "BIP 44" with the default settings of purpose=44. We even can have some coins that don't support BIP 44 (example of Tezos which only was supporting hardened path when it was integrated) so we sometimes will have dedicated path.

The general order of the derivation will be:

- scan for esoteric / custom accounts
- scan for legacy
- scan for segwit (if relevant)
- scan for native segwit (if relevant)

By convention, the **Last** DerivationMode of the list is the default one we will invite our user to create a new account on. (with some exception like Segwit and Native Segwit are both suggested to creation for backward compatibility purpose)
