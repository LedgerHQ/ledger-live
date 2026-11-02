import type { z } from "zod";
import type {
  BALANCE_RANGES,
  BalanceHistoryGroupSchema,
  BalanceHistoryPageSchema,
  BalanceHistoryPointSchema,
  AssetChangeSchema,
  BalanceEntrySchema,
  BalanceGroupSchema,
  BalancePageSchema,
  PortfolioAccountSchema,
  PortfolioRegistrationEntrySchema,
  PortfolioSchema,
  UpdatesPageSchema,
  UpdateViewSchema,
} from "./schema";

export type Portfolio = z.infer<typeof PortfolioSchema>;
export type PortfolioRegistrationEntry = z.infer<typeof PortfolioRegistrationEntrySchema>;
export type PortfolioAccount = z.infer<typeof PortfolioAccountSchema>;
export type AssetChange = z.infer<typeof AssetChangeSchema>;
export type UpdateView = z.infer<typeof UpdateViewSchema>;
export type BalanceEntry = z.infer<typeof BalanceEntrySchema>;
export type BalanceGroup = z.infer<typeof BalanceGroupSchema>;
export type UpdatesPage = z.infer<typeof UpdatesPageSchema>;
export type BalancePage = z.infer<typeof BalancePageSchema>;

/**
 * A registration the service accepts. The `type` values are the ones the service validates against:
 * the OpenAPI spec leaves `type` out of the xpub shape, but the service requires it.
 */
export type PortfolioRegistration =
  | { type: "account"; accountId: string; network: string; addresses: string[] }
  | { type: "auto_derive"; network: string; xpub: string; derivationPath: string }
  | { type: "evm" | "solana"; address: string };

export type PortfolioParams = { portfolioId: string };

/** Query shared by the paginated reads. `account` is the registered `accountId`. */
export type PortfolioReadParams = PortfolioParams & {
  currency?: string;
  size?: number;
  order?: "ASC" | "DESC";
  token?: string;
  network?: string;
  account?: string;
  asset?: string;
};

export type AddRegistrationsParams = PortfolioParams & { registrations: PortfolioRegistration[] };

/** `registrationIds` are the ids a portfolio lists in its `registrations`. */
export type RemoveRegistrationsParams = PortfolioParams & { registrationIds: string[] };

/**
 * `accountId` is the id the service gave the account, as `GET /portfolio/{id}` lists it. Only the
 * `account` kind of update is supported; `cardano` takes lists by role instead, and `evm` is
 * refused by the service.
 */
export type AddAddressesParams = PortfolioParams & { accountId: string; addresses: string[] };

export type BalanceRange = (typeof BALANCE_RANGES)[number];
export type BalanceHistoryPoint = z.infer<typeof BalanceHistoryPointSchema>;
export type BalanceHistoryGroup = z.infer<typeof BalanceHistoryGroupSchema>;
export type BalanceHistoryPage = z.infer<typeof BalanceHistoryPageSchema>;

export type BalanceHistoryParams = PortfolioReadParams & { range?: BalanceRange };
