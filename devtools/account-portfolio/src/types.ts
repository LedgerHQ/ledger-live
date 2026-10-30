export type AccountPortfolioAction =
  // Portfolio
  | "getPortfolio"
  | "createPortfolio"
  | "registerAccounts"
  | "removeRegistrations"
  | "addAddresses"
  // Read
  | "getBalance"
  | "getBalanceHistory"
  | "getUpdates";

export interface AccountPortfolioRequest {
  readonly action: AccountPortfolioAction;
  readonly portfolioId: string;
  readonly currency: string;
  /** Narrows balance and updates to one registered account (its `accountId`). */
  readonly account?: string;
  /** JSON array body of `registerAccounts`. */
  readonly registrationsJson?: string;
  /** Ids of the registrations `removeRegistrations` takes out, as a portfolio lists them. */
  readonly registrationIds?: readonly string[];
  /** The service's id of the account `addAddresses` adds to, as `getPortfolio` lists it. */
  readonly addressAccountId?: string;
  /** Addresses `addAddresses` adds to that account. */
  readonly addresses?: readonly string[];
  /** How far back `getBalanceHistory` goes: all, day, hour, month, week or year. */
  readonly range?: string;
  /** Where `getBalanceHistory` resumes: the `nextToken` of the page before. */
  readonly pageToken?: string;
}

/** The state of an account in the portfolio, as the service reports it. */
export type PortfolioAccountStatus =
  | "not_registered"
  | "registration_failure"
  | "synchronized"
  | "uninitialized";

export type PortfolioBalanceStatus = "confirmed" | "pending";

/** An amount of one asset, with the CAL metadata and the value the service attaches to it. */
export interface PortfolioAssetView {
  readonly network: string;
  readonly asset: string;
  /** The CAL id, which is the icon's `ledgerId`; absent for an asset CAL does not know. */
  readonly calId?: string;
  readonly ticker?: string;
  readonly name?: string;
  readonly decimals?: number;
  /** Integer string in the asset's smallest unit; negative when the account sent it. */
  readonly amount: string;
  /** Worth of `amount` in the requested currency. */
  readonly currencyValue?: number;
}

export interface PortfolioBalanceView extends PortfolioAssetView {
  readonly accountId: string;
  readonly status: PortfolioBalanceStatus;
  readonly estimated: boolean;
  readonly locked: boolean;
}

export interface PortfolioBalanceFailureView {
  readonly network: string;
  readonly accountId: string;
  readonly error: string;
}

export interface PortfolioOperationView {
  readonly network: string;
  readonly accountId: string;
  readonly time: string;
  readonly hash: string;
  readonly failed: boolean;
  /** Not in a block yet. */
  readonly pending: boolean;
  readonly deltas: readonly PortfolioAssetView[];
  readonly fee: PortfolioAssetView;
}

/** A registration the portfolio holds: the id it is removed by, and what it was registered with. */
export interface PortfolioRegistrationView {
  readonly id: string;
  readonly type: string;
  /** The address, or the network and the start of the xpub. */
  readonly detail: string;
}

export interface PortfolioHistoryPointView extends PortfolioAssetView {
  readonly accountId: string;
  readonly time: string;
}

/** A successful response, reduced to what the tool displays. */
export type AccountPortfolioView =
  | {
      readonly kind: "portfolio";
      readonly id: string;
      readonly registrations: number;
      readonly registrationEntries: readonly PortfolioRegistrationView[];
      readonly accounts: readonly {
        readonly id: string;
        readonly network: string;
        readonly status: PortfolioAccountStatus;
      }[];
    }
  | {
      readonly kind: "balance";
      readonly entries: readonly PortfolioBalanceView[];
      /** Accounts the service could not read. */
      readonly failures: readonly PortfolioBalanceFailureView[];
      readonly hasMore: boolean;
    }
  | {
      readonly kind: "account";
      readonly id: string;
      readonly network: string;
      readonly status: PortfolioAccountStatus;
    }
  | {
      readonly kind: "history";
      readonly points: readonly PortfolioHistoryPointView[];
      readonly failures: readonly PortfolioBalanceFailureView[];
      readonly hasMore: boolean;
      /** What `pageToken` takes to read the next page; absent on the last one. */
      readonly nextToken?: string;
    }
  | {
      readonly kind: "updates";
      readonly operations: readonly PortfolioOperationView[];
      readonly hasMore: boolean;
    };

export interface AccountPortfolioResult {
  readonly ok: boolean;
  readonly durationMs: number;
  /** What was sent, so a failure can be read against the exact call. */
  readonly sent: { readonly method: string; readonly url: string; readonly body?: unknown };
  /** The validated response, or the error (including zod parse issues). */
  readonly body: unknown;
  /** The currency `currencyValue` is expressed in. */
  readonly currency: string;
  /** Present on success. */
  readonly view?: AccountPortfolioView;
}

export interface AccountPortfolioToolAccount {
  readonly accountUUID: string;
  readonly label: string;
  /** The registration of the account, as JSON. */
  readonly registration: string;
}

export interface AccountPortfolioToolProps {
  readonly accounts: readonly AccountPortfolioToolAccount[];
  readonly defaultPortfolioId: string;
  /** Base URL the app talks to; empty when the service is disabled. */
  readonly serviceUrl: string;
  /** Runs one real call against the Portfolio service. Never rejects: failures are in the result. */
  readonly onRun: (request: AccountPortfolioRequest) => Promise<AccountPortfolioResult>;
}

// Models shared by the screen, its tabs and the utils. They are internal: `index.ts` leaves them out.

export interface Run {
  readonly id: number;
  readonly action: AccountPortfolioAction;
  /** The portfolio the call was made on. */
  readonly portfolioId: string;
  readonly at: number;
  /** What was sent, so a next page can be asked with the same parameters. */
  readonly request: AccountPortfolioRequest;
  readonly result: AccountPortfolioResult;
}

export interface AccountItem {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

/** Portfolio manages a portfolio, Read asks it questions, then the answers and the calls of the session. */
export type AccountPortfolioTab = "portfolio" | "read" | "results" | "history";
