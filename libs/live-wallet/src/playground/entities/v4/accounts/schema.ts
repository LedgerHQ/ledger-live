import { z } from "zod";

import { CryptoCurrencySchema, TokenCurrencySchema } from "../../external/currency/schema";
import { BigNumberSchema } from "../../external/bignumber/schema";

export const DerivationModeSchema = z.enum([
  "",
  "ethM",
  "ethMM",
  "etcM",
  "aeternity",
  "tezbox",
  "tezosbip44h",
  "galleonL",
  "tezboxL",
  "taproot",
  "native_segwit",
  "segwit",
  "segwit_unsplit",
  "sep5",
  "unsplit",
  "polkadotbip44",
  "glifLegacy",
  "glif",
  "filecoinBIP44",
  "casper_wallet",
  "solanaMain",
  "solanaSub",
  "solanaBip44Change",
  "hederaBip44",
  "cardano",
  "nearbip44h",
  "vechain",
  "internet_computer",
  "stacks_wallet",
  "icon",
  "ton",
  "sui",
  "aptos",
  "minabip44",
  "canton",
  "cashaddr",
  "celo",
  "celoMM",
  "celoEvm",
]);

export const TokenAccountSchema = z.object({
  type: z.literal("TokenAccount"),
  id: z.string(),
  parentId: z.string(),
  token: TokenCurrencySchema,
  balance: BigNumberSchema,
  spendableBalance: BigNumberSchema,
  creationDate: z.date(),
  operationsCount: z.number(),
});

// Should the Account be splitted out even more? blockchain based data vs ui needed data? is is actually all blockchain data here?

/*
For reference, this is what Wallet Sync have as Account Descriptor state:

const accountDescriptorSchema = z.object({
  id: z.string(),
  currencyId: z.string(),
  freshAddress: z.string(),
  seedIdentifier: z.string(),
  derivationMode: z.string(),
  index: z.number(),
});
*/

export const AccountSchema = z.object({
  type: z.literal("Account"),
  id: z.string(),
  derivationMode: DerivationModeSchema,
  index: z.number(),
  freshAddress: z.string(),
  freshAddressPath: z.string(),
  used: z.boolean(), // this field also would be used to implement an efficient scan account
  balance: BigNumberSchema,
  spendableBalance: BigNumberSchema,
  blockHeight: z.number(),
  currency: CryptoCurrencySchema,
  feesCurrency: z.union([CryptoCurrencySchema, TokenCurrencySchema]).optional(),
  subAccounts: z.array(TokenAccountSchema).optional(),

  // TBD
  seedIdentifier: z.string(), // UI don't need?
  xpub: z.string().optional(), // UI don't need?
  creationDate: z.date(), // UI don't need?
  operationsCount: z.number(), // UI don't need?

  // these sync related fields should be moved outside
  lastSyncDate: z.date(),
  syncHash: z.string().optional(), // UI don't need?
});

export const AccountsByIdSchema = z.record(z.string(), AccountSchema);
