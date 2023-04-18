import type { BigNumber } from "bignumber.js";
import type {
  CryptoCurrency,
  TokenCurrency,
  Unit,
} from "@ledgerhq/types-cryptoassets";
import type { OperationRaw, Operation } from "./operation";
import type { DerivationMode } from "./derivation";
import type { SwapOperation, SwapOperationRaw } from "./swap";
import { ProtoNFT, ProtoNFTRaw } from "./nft";

export type GranularityId = "HOUR" | "DAY" | "WEEK";

// the cache is maintained for as many granularity as we need on Live.
// it's currently an in memory cache so there is no problem regarding the storage.
// in future, it could be saved and we can rethink how it's stored (independently of how it's in memory)
export type BalanceHistoryCache = Record<
  GranularityId,
  BalanceHistoryDataCache
>;

// the way BalanceHistoryDataCache works is:
// - a "cursor" date which is the "latestDate" representing the latest datapoint date. it's null if it never was loaded or if it's empty.
// - an array of balances. balances are stored in JSNumber even tho internally calculated with bignumbers because we want very good perf. it shouldn't impact imprecision (which happens when we accumulate values, not when presenting to user)
// there are as much value in that array as there are historical datapoint for a given account.
// each time an account will sync, it potentially update it by adding a datapoint and possibility updating the cursor in that case.
export type BalanceHistoryDataCache = {
  latestDate: number | null | undefined;
  balances: number[];
};

/** A token belongs to an Account and share the parent account address */
export type TokenAccount = {
  type: "TokenAccount";
  id: string;
  // id of the parent account this token account belongs to
  parentId: string;
  token: TokenCurrency;
  balance: BigNumber;
  spendableBalance: BigNumber;
  creationDate: Date;
  operationsCount: number;
  operations: Operation[];
  pendingOperations: Operation[];
  starred: boolean;
  // Cache of balance history that allows a performant portfolio calculation.
  // currently there are no "raw" version of it because no need to at this stage.
  // could be in future when pagination is needed.
  balanceHistoryCache: BalanceHistoryCache;
  // Swap operations linked to this account
  swapHistory: SwapOperation[];
  approvals?: Array<{
    sender: string;
    value: string;
  }>;
};

/** A child account belongs to an Account but has its own address */
export type ChildAccount = {
  type: "ChildAccount";
  id: string;
  name: string;
  starred: boolean;
  // id of the parent account this token account belongs to
  parentId: string;
  currency: CryptoCurrency;
  address: string;
  balance: BigNumber;
  creationDate: Date;
  operationsCount: number;
  operations: Operation[];
  pendingOperations: Operation[];
  // Cache of balance history that allows a performant portfolio calculation.
  // currently there are no "raw" version of it because no need to at this stage.
  // could be in future when pagination is needed.
  balanceHistoryCache: BalanceHistoryCache;
  // Swap operations linked to this account
  swapHistory: SwapOperation[];
};

/** */
export type Address = {
  address: string;
  derivationPath: string;
};

/**
 * Account type is the main level account of a blockchain currency.
 * Each family maybe need an extra field, to solve this, you can have some subtyping like this:


    export type BitcoinAccount = Account & { bitcoinResources: BitcoinResources }

and all parts where we would need it, we would need to cast,

    const bitcoinAccount = account as BitcoinAccount;

and that BitcoinAccount type would be part of a coin integration family specific indeed.
 */
export type Account = {
  type: "Account";
  // unique account identifier
  id: string;
  // a unique way to identify a seed the account was associated with
  // it MUST be different between 2 seeds
  // but it is not necessarily the same between 2 accounts (if possible – not always possible)
  // in BTC like accounts, we use pubKey(purpose'/coinType')
  // For other accounts that don't have sub derivation, we have used the account address
  seedIdentifier: string;
  // account xpub if available
  xpub?: string;
  // Identify the derivation used. it allows us to map this to a derivation scheme.
  // example of values: segwit | unsplit | segwit_unsplit | mew | eth_mew (eg for etc accounts on eth)
  // the special value of '' means it's bip44 with purpose 44.
  derivationMode: DerivationMode;
  // the iterated number to derive the account in a given derivationMode config
  // in context of bip44, it would be the account field of bip44 ( m/purpose'/cointype'/account' )
  index: number;
  // next receive address. to be used to display to user.
  // (deprecated - corresponds to freshAddresses[0].address)
  freshAddress: string;
  // The path linked to freshAddress. to be used to validate with the device if it corresponds to freshAddress.
  // example: 44'/0'/0'/0/0
  // (deprecated - corresponds to freshAddresses[0].derivationPath)
  freshAddressPath: string;
  // an array containing all fresh addresses and paths
  // may be empty if no sync has occurred
  freshAddresses: Address[];
  // account name
  name: string;
  // starred
  starred: boolean;
  // says if the account essentially "exists". an account has been used in the past, but for some reason the blockchain finds it empty (no ops, no balance,..)
  used: boolean;
  // account balance in satoshi
  balance: BigNumber;
  // part of the balance that can effectively be spent
  spendableBalance: BigNumber;
  // date the account started "existing", essentially the date of the older tx received/done of this account
  // It is equal to Date.now() for EMPTY accounts because empty account don't really "exists"
  creationDate: Date;
  // the last block height currently synchronized
  blockHeight: number;
  // ------------------------------------- Specific account fields
  // currency of this account
  currency: CryptoCurrency;
  // Some blockchains may use a different currency than the main one to pay fees
  feesCurrency?: CryptoCurrency | TokenCurrency;
  // user preferred unit to use. unit is coming from currency.units. You can assume currency.units.indexOf(unit) will work. (make sure to preserve reference)
  unit: Unit;
  // The total number of operations (operations[] can be partial)
  operationsCount: number;
  // lazy list of operations that exists on the blockchain.
  operations: Operation[];
  // pending operations that has been broadcasted but are not yet in operations
  // this is for optimistic updates UI. the Operation objects are temporary and
  // might not be the real one that will arrives on operations array.
  // only Operation#id needs to be guaranteed the same.
  // the array resulting of pendingOperations.concat(operations)
  // is guaranteed to contains unique ops (by id) at any time and also is time DESC sorted.
  pendingOperations: Operation[];
  // used to know when the last sync happened
  lastSyncDate: Date;
  // A configuration for the endpoint to use. (usecase: Ripple node)
  // FIXME drop and introduce a config{} object
  endpointConfig?: string | null | undefined;
  // An account can have sub accounts.
  // A sub account can be either a token account or a child account in some blockchain.
  // They are attached to the parent account in the related blockchain.
  // CONVENTION:
  // a SubAccount is living inside an Account but is not an entity on its own,
  // therefore, there is no .parentAccount in it, which will means you will need to always have a tuple of (parentAccount, account)
  // we will use the naming (parentAccount, account) everywhere because a sub account is not enough and you need the full context with this tuple.
  // These are two valid examples:
  // I'm inside a ZRX token account of Ethereum 1: { parentAccount: Ethereum 1, account: ZRX }
  // I'm just inside the Ethereum 1: { account: Ethereum 1, parentAccount: undefined }
  // "account" is the primary account that you use/select/view. It is a `AccountLike`.
  // "parentAccount", if available, is the contextual account. It is a `?Account`.
  subAccounts?: SubAccount[];
  // Cache of balance history that allows a performant portfolio calculation.
  // currently there are no "raw" version of it because no need to at this stage.
  // could be in future when pagination is needed.
  balanceHistoryCache: BalanceHistoryCache;
  // On some blockchain, an account can have resources (gained, delegated, ...)
  // Swap operations linked to this account
  swapHistory: SwapOperation[];
  // Hash used to discard tx history on sync
  syncHash?: string;
  // Array of NFTs computed by diffing NFTOperations ordered from newest to oldest
  nfts?: ProtoNFT[];
};

/** super type that is either a token or a child account */
export type SubAccount = TokenAccount | ChildAccount;

/** One of the Account type */
export type AccountLike = Account | SubAccount;

/**
 * An array of AccountLikes
 */
export type AccountLikeArray =
  | AccountLike[]
  | TokenAccount[]
  | ChildAccount[]
  | Account[];

/** */
export type TokenAccountRaw = {
  type: "TokenAccountRaw";
  id: string;
  starred?: boolean;
  parentId: string;
  tokenId: string;
  creationDate?: string;
  operationsCount?: number;
  operations: OperationRaw[];
  pendingOperations: OperationRaw[];
  balance: string;
  spendableBalance?: string;
  balanceHistoryCache?: BalanceHistoryCache;
  swapHistory?: SwapOperationRaw[];
  approvals?: Array<{
    sender: string;
    value: string;
  }>;
};

/** */
export type ChildAccountRaw = {
  type: "ChildAccountRaw";
  id: string;
  name: string;
  starred?: boolean;
  parentId: string;
  currencyId: string;
  address: string;
  creationDate?: string;
  operationsCount?: number;
  operations: OperationRaw[];
  pendingOperations: OperationRaw[];
  balance: string;
  balanceHistoryCache?: BalanceHistoryCache;
  swapHistory?: SwapOperationRaw[];
};

/** */
export type AccountRaw = {
  id: string;
  seedIdentifier: string;
  xpub?: string;
  derivationMode: DerivationMode;
  index: number;
  freshAddress: string;
  freshAddressPath: string;
  freshAddresses: Address[];
  name: string;
  starred?: boolean;
  used?: boolean;
  balance: string;
  spendableBalance?: string;
  blockHeight: number;
  creationDate?: string;
  operationsCount?: number;
  // this is optional for backward compat
  // ------------------------------------- Specific raw fields
  currencyId: string;
  feesCurrencyId?: string;
  operations: OperationRaw[];
  pendingOperations: OperationRaw[];
  unitMagnitude: number;
  lastSyncDate: string;
  endpointConfig?: string | null | undefined;
  subAccounts?: SubAccountRaw[];
  balanceHistoryCache?: BalanceHistoryCache;
  swapHistory?: SwapOperationRaw[];
  syncHash?: string;
  nfts?: ProtoNFTRaw[];
};

/** */
export type SubAccountRaw = TokenAccountRaw | ChildAccountRaw;

/** */
export type AccountRawLike = AccountRaw | SubAccountRaw;

/** */
export type AccountIdParams = {
  type: string;
  version: string;
  currencyId: string;
  xpubOrAddress: string;
  derivationMode: DerivationMode;
};
