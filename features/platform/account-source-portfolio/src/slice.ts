import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Portfolio } from "@domain/api-account-portfolio";

/** How the last balance read of one account went through this source. */
export type PortfolioAccountOutcome = {
  /** `pending` and `failed` hand the account to the next ranked source. */
  readonly outcome: "ok" | "pending" | "failed";
  readonly detail?: string;
  /** The service ids the account was read from. */
  readonly serverIds: readonly string[];
  readonly rows: number;
  readonly at: number;
};

export type PortfolioActivityKind = "portfolio" | "register" | "prune" | "balance" | "error";

/** One thing the source did against the service, latest last. */
export type PortfolioActivity = {
  readonly id: number;
  readonly at: number;
  readonly kind: PortfolioActivityKind;
  readonly ok: boolean;
  readonly summary: string;
  readonly durationMs?: number;
};

export type PortfolioSourceState = {
  /** The source is in the router: whoever injects it says so. */
  enabled: boolean;
  /** The portfolio as the service last listed it. */
  server?: { portfolio: Portfolio; at: number };
  outcomes: Record<string, PortfolioAccountOutcome>;
  activity: PortfolioActivity[];
  nextActivityId: number;
  /** Calls to the service in flight. */
  busy: number;
};

export type WithPortfolioSource = { accountSourcePortfolio: PortfolioSourceState };

const ACTIVITY_LIMIT = 200;

export const initialPortfolioSourceState: PortfolioSourceState = {
  enabled: false,
  outcomes: {},
  activity: [],
  nextActivityId: 0,
  busy: 0,
};

export const portfolioSourceSlice = createSlice({
  name: "accountSourcePortfolio",
  initialState: initialPortfolioSourceState,
  reducers: {
    portfolioSourceEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.enabled = payload;
    },
    portfolioListed: (state, { payload }: PayloadAction<{ portfolio: Portfolio; at: number }>) => {
      state.server = payload;
    },
    portfolioActivityLogged: (state, { payload }: PayloadAction<Omit<PortfolioActivity, "id">>) => {
      state.activity.push({ ...payload, id: state.nextActivityId++ });
      if (state.activity.length > ACTIVITY_LIMIT) state.activity.splice(0, 1);
    },
    portfolioOutcomesRecorded: (
      state,
      { payload }: PayloadAction<Record<string, PortfolioAccountOutcome>>,
    ) => {
      Object.assign(state.outcomes, payload);
    },
    portfolioActivityCleared: state => {
      state.activity = [];
    },
    portfolioCallStarted: state => {
      state.busy += 1;
    },
    portfolioCallEnded: state => {
      state.busy = Math.max(0, state.busy - 1);
    },
  },
  selectors: {
    selectPortfolioSourceEnabled: state => state.enabled,
    selectPortfolioServer: state => state.server,
  },
});

export const {
  portfolioSourceEnabled,
  portfolioListed,
  portfolioActivityLogged,
  portfolioOutcomesRecorded,
  portfolioActivityCleared,
  portfolioCallStarted,
  portfolioCallEnded,
} = portfolioSourceSlice.actions;

export const { selectPortfolioSourceEnabled, selectPortfolioServer } =
  portfolioSourceSlice.getSelectors((state: WithPortfolioSource) => state.accountSourcePortfolio);
