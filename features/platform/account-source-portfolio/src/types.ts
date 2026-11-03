import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountUUID } from "@domain/entity-account-descriptor";

/** How the last balance read of an account went. */
export type PortfolioOutcome = {
  readonly status: "served" | "failed";
  /** Never an address nor a service account id. */
  readonly detail?: string;
  readonly rows: number;
  readonly at: number;
};

export type PortfolioActivity = {
  readonly id: number;
  readonly at: number;
  readonly ok: boolean;
  readonly summary: string;
};

export type PortfolioSourceSnapshot = {
  readonly listing?: { readonly portfolio: Portfolio; readonly at: number };
  readonly outcomes: Readonly<Record<AccountUUID, PortfolioOutcome>>;
  readonly activity: readonly PortfolioActivity[];
  readonly busy: boolean;
};
