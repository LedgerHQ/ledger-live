// @flow

import type { BigNumber } from "bignumber.js";
import type { CryptoCurrency, TokenCurrency, Unit } from "./currencies";
import type { OperationRaw, Operation } from "./operation";
import type { DerivationMode } from "../derivation";

export type TokenAccount = {
  type: "TokenAccount",
  id: string,
  // id of the parent account this token accuont belongs to
  parentId: string,
  token: TokenCurrency,
  operations: Operation[],
  balance: BigNumber
};

export type Account = {
  type: "Account",
  // unique account identifier
  id: string,

  // a unique way to identify a seed the account was associated with
  // it MUST be different between 2 seeds
  // but it is not necessarily the same between 2 accounts (if possible – not always possible)
  // in BTC like accounts, we use pubKey(purpose'/coinType')
  // For other accounts that don't have sub derivation, we have used the account address
  seedIdentifier: string,

  // account xpub if available
  xpub?: string,

  // Identify the derivation used. it allows us to map this to a derivation scheme.
  // exemple of values: segwit | unsplit | segwit_unsplit | mew | eth_mew (eg for etc accounts on eth)
  // the special value of '' means it's bip44 with purpose 44.
  derivationMode: DerivationMode,

  // the iterated number to derivate the account in a given derivationMode config
  // in context of bip44, it would be the account field of bip44 ( m/purpose'/cointype'/account' )
  index: number,

  // next receive address. to be used to display to user.
  freshAddress: string,

  // The path linked to freshAddress. to be used to validate with the device if it corresponds to freshAddress.
  // exemple: 44'/0'/0'/0/0
  freshAddressPath: string,

  // account name
  name: string,

  // account balance in satoshi
  balance: BigNumber,

  // the last block height currently synchronized
  blockHeight: number,

  // ------------------------------------- Specific account fields

  // currency of this account
  currency: CryptoCurrency,

  // user preferred unit to use. unit is coming from currency.units. You can assume currency.units.indexOf(unit) will work. (make sure to preserve reference)
  unit: Unit,

  // lazy list of operations that exists on the blockchain.
  operations: Operation[],

  // pending operations that has been broadcasted but are not yet in operations
  // this is for optimistic updates UI. the Operation objects are temporary and
  // might not be the real one that will arrives on operations array.
  // only Operation#id needs to be guaranteed the same.
  // the array resulting of pendingOperations.concat(operations)
  // is guaranteed to contains unique ops (by id) at any time and also is time DESC sorted.
  pendingOperations: Operation[],

  // used to know when the last sync happened
  lastSyncDate: Date,

  // A configuration for the endpoint to use. (usecase: Ripple node)
  endpointConfig?: ?string,

  // An account can have sub accounts, in that case they are called "token accounts".
  // tokenAccounts are tokens among a blockchain of the parent account currency, attached to that same parent account.
  // CONVENTION:
  // a TokenAccount is living inside an Account but is not an entity on its own,
  // therefore, there is no .parentAccount in it, which will means you will need to always have a tuple of (parentAccount, account)
  // we will use the naming (parentAccount, account) everywhere because a token account is not enough and you need the full context with this tuple.
  // These are two valid examples:
  // I'm inside a ZRX token account of Ethereum 1: { parentAccount: Ethereum 1, account: ZRX }
  // I'm just inside the Ethereum 1: { account: Ethereum 1, parentAccount: undefined }
  // "account" is the primary account that you use/select/view. It is a `Account | TokenAccount`.
  // "parentAccount", if available, is the contextual account. It is a `?Account`.
  tokenAccounts?: TokenAccount[]
};

export type TokenAccountRaw = {
  id: string,
  parentId: string,
  tokenId: string,
  operations: OperationRaw[],
  balance: string
};

export type AccountRaw = {
  id: string,
  seedIdentifier: string,
  xpub?: string,
  derivationMode: DerivationMode,
  index: number,
  freshAddress: string,
  freshAddressPath: string,
  name: string,
  balance: string,
  blockHeight: number,
  // ------------------------------------- Specific raw fields
  currencyId: string,
  operations: OperationRaw[],
  pendingOperations: OperationRaw[],
  unitMagnitude: number,
  lastSyncDate: string,
  endpointConfig?: ?string,
  tokenAccounts?: TokenAccountRaw[]
};
