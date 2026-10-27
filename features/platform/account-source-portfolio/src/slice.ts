import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Portfolio } from "@domain/api-account-portfolio";

/** How the last balance read of one account went through this source. */
export type PortfolioAccountOutcome = {
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
  /** The source is in the router: whoever injects it (the devtool, for now) says so. */
  enabled: boolean;
  portfolioId?: string;
  /** The portfolio as the service last listed it. */
  server?: { portfolio: Portfolio; at: number };
  outcomes: Record<string, PortfolioAccountOutcome>;
  activity: PortfolioActivity[];
  nextActivityId: number;
  /** A reconcile or a read is talking to the service. */
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
    // A new id is a new portfolio: what the service listed for the old one no longer applies.
    portfolioIdAssigned: (state, { payload }: PayloadAction<string>) => {
      if (state.portfolioId === payload) return;
      state.portfolioId = payload;
      state.server = undefined;
      state.outcomes = {};
    },
    portfolioListed: (
      state,
      { payload }: PayloadAction<{ portfolioId: string; portfolio: Portfolio; at: number }>,
    ) => {
      if (state.portfolioId !== payload.portfolioId) return;
      state.server = { portfolio: payload.portfolio, at: payload.at };
    },
    portfolioActivityLogged: (
      state,
      { payload }: PayloadAction<Omit<PortfolioActivity, "id" | "at"> & { at: number }>,
    ) => {
      state.activity.push({ ...payload, id: state.nextActivityId++ });
      if (state.activity.length > ACTIVITY_LIMIT) state.activity.splice(0, 1);
    },
    portfolioOutcomesRecorded: (
      state,
      {
        payload,
      }: PayloadAction<{ portfolioId: string; outcomes: Record<string, PortfolioAccountOutcome> }>,
    ) => {
      // A read that started on a portfolio since renewed says nothing of the current one.
      if (state.portfolioId !== payload.portfolioId) return;
      Object.assign(state.outcomes, payload.outcomes);
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
    selectPortfolioId: state => state.portfolioId,
    selectPortfolioServer: state => state.server,
  },
});

export const {
  portfolioSourceEnabled,
  portfolioIdAssigned,
  portfolioListed,
  portfolioActivityLogged,
  portfolioOutcomesRecorded,
  portfolioActivityCleared,
  portfolioCallStarted,
  portfolioCallEnded,
} = portfolioSourceSlice.actions;

export const { selectPortfolioSourceEnabled, selectPortfolioId, selectPortfolioServer } =
  portfolioSourceSlice.getSelectors((state: WithPortfolioSource) => state.accountSourcePortfolio);
