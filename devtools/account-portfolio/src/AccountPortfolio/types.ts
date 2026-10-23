import type {
  AccountItem,
  AccountPortfolioAction,
  AccountPortfolioTab,
  AccountPortfolioView,
  Run,
} from "../types";
import type { NetworkFormViewModel } from "./hooks/useNetworkForm";
import type { WriteFormViewModel } from "./hooks/useWriteForm";

/** Everything the view shows and every action it can trigger. */
export interface AccountPortfolioViewModel extends NetworkFormViewModel, WriteFormViewModel {
  readonly serviceUrl: string;

  readonly tab: AccountPortfolioTab;
  readonly setTab: (tab: AccountPortfolioTab) => void;

  readonly portfolioId: string;
  readonly setPortfolioId: (value: string) => void;
  readonly currency: string;
  readonly setCurrency: (value: string) => void;

  readonly hasAccounts: boolean;
  readonly accountItems: readonly AccountItem[];
  readonly chosen: string;
  readonly choose: (accountUUID: string) => void;

  /** The JSON array sent to register accounts: built from the chosen accounts, or typed by hand. */
  readonly payload: string;
  readonly payloadValid: boolean;
  readonly isCustomPayload: boolean;
  readonly setCustomPayload: (value: string) => void;
  readonly resetPayload: () => void;
  readonly canRegister: boolean;
  readonly registerLabel: string;

  /** Where the portfolio stands, from the calls made on it this session. */
  readonly progress: { readonly created: boolean; readonly registered: boolean };
  /** The step to do next on this portfolio; undefined once it is created and filled. */
  readonly nextStep: "createPortfolio" | "registerAccounts" | undefined;

  readonly removeIdsText: string;
  readonly setRemoveIdsText: (value: string) => void;
  readonly removeCount: number;
  readonly canRemove: boolean;
  /** The last Get portfolio listed registrations whose ids can fill the field. */
  readonly canFillRemoveIds: boolean;
  readonly fillRemoveIds: () => void;

  readonly addAccountId: string;
  readonly setAddAccountId: (value: string) => void;
  readonly addAddressesText: string;
  readonly setAddAddressesText: (value: string) => void;
  readonly addAddressesCount: number;
  readonly canAddAddresses: boolean;

  readonly accountFilter: string;
  readonly setAccountFilter: (value: string) => void;

  /** Hides the assets that have no ledger id, even after CAL was asked. */
  readonly hideUnknown: boolean;
  readonly setHideUnknown: (value: boolean) => void;

  readonly running: AccountPortfolioAction | undefined;
  /** No call can start: one is running, or the service is disabled. */
  readonly blocked: boolean;
  /** The portfolio id is empty: the calls of the Portfolio and Read sections cannot start. */
  readonly portfolioMissing: boolean;
  /** The portfolio id and the currency can be edited; they are read-only otherwise. */
  readonly contextOpen: boolean;
  readonly setContextOpen: (open: boolean) => void;
  /** How far back `Get balance history` goes. */
  readonly range: string;
  readonly setRange: (value: string) => void;
  readonly run: (action: AccountPortfolioAction) => Promise<void>;

  readonly history: readonly Run[];
  readonly selected: Run | undefined;
  /** The selected result's view, without the unknown assets when they are hidden. */
  readonly resultView: AccountPortfolioView | undefined;
  /** How many entries `hideUnknown` took out of `resultView`. */
  readonly hiddenCount: number;
  /** What the search narrows the result with. */
  readonly search: string;
  readonly setSearch: (value: string) => void;
  /** The selected result has lines to search: balances, history and updates. */
  readonly searchable: boolean;
  /** How many lines the search took out of `resultView`. */
  readonly unmatchedCount: number;
  /** Shows a past call in the Results tab. */
  readonly openRun: (id: number) => void;
  readonly clearHistory: () => void;
}
