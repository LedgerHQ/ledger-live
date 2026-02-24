/**
 * Accounts domain – Zod schemas and inferred types.
 * Collocated with slice/load/selectors.
 */
import { z } from "zod";

const TokenAccountV4Schema = z.object({
  type: z.literal("TokenAccount"),
  id: z.string(),
  parentId: z.string(),
  tokenId: z.string(), // resolve via lookup (e.g. getCryptoAssetsStore().findTokenById) for TokenCurrency
  balance: z.string(), // serializable; parse to BigNumber when needed
  spendableBalance: z.string(), // serializable; parse to BigNumber when needed
  // derived data that we may drop => deprecated
  creationDate: z.number(), // timestamp ms; restore with new Date() when needed
  operationsCount: z.number(),
});

const AccountV4Schema = z.object({
  type: z.literal("Account"),
  id: z.string(),
  currencyId: z.string(), // resolve via getCryptoCurrencyById for CryptoCurrency
  balance: z.string(), // serializable; parse to BigNumber when needed
  subAccounts: z.array(TokenAccountV4Schema).optional(),

  // key chain / HDD / device derivation / discovery of account / device signer
  derivationMode: z.string(),
  index: z.number(),
  freshAddress: z.string(), // "address"
  freshAddressPath: z.string(), // 49'/0'/{index}'/23/0

  // coin specifics / related to transactional flows
  spendableBalance: z.string(), // serializable; parse to BigNumber when needed
  feesCurrencyId: z.string().optional(), // CryptoCurrency.id or TokenCurrency.id; resolve by lookup
  // derived data that we may drop => deprecated
  used: z.boolean(), // useful for scan accounts only. not used by UI. can be made into an API?
  creationDate: z.number(), // timestamp ms; restore with new Date() when needed
  operationsCount: z.number(), // UI don't need?
  // non UI data
  seedIdentifier: z.string(), // UI don't need. but wallet sync use.
  xpub: z.string().optional(), // UI don't need except in settings account. used by coin implem.
  // slice transaction / block
  blockHeight: z.number(), // blockchain specific but used to determine on UI if op is "confirmed"
  // => Slice Account Sync ? these sync related fields should be moved outside
  lastSyncDate: z.number(), // timestamp ms; restore with new Date() when needed
  syncHash: z.string().optional(), // UI don't need?
});

/** Accounts slice state: byId = id → Account, allIds = ordered list of account ids. */
export const AccountsStateSchema = z.object({
  byId: z.record(AccountV4Schema), // id -> Account
  allIds: z.array(z.string()), // ordered list of account ids
});

export type TokenAccountV4 = z.infer<typeof TokenAccountV4Schema>;
export type AccountV4 = z.infer<typeof AccountV4Schema>;
export type AccountsState = z.infer<typeof AccountsStateSchema>;
