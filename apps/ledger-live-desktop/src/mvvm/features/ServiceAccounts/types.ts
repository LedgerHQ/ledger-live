import type { ReactNode } from "react";
import type { PortfolioServiceAccount } from "@features/platform-account-portfolio";

export type ServiceAccountRowView = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly network: string;
  readonly status: PortfolioServiceAccount["status"];
  readonly error: string | null;
  /** Sort key only: never shown, so it is not masked in discreet mode. */
  readonly value: number | null;
  readonly valueLabel: string | null;
  readonly balanceLabel: string | null;
  /** The service holds an unconfirmed amount for one of the balances. */
  readonly pending: boolean;
};

export type ServiceAccountsViewProps = {
  readonly phase: "loading" | "ready" | "error";
  readonly error: string | null;
  readonly totalLabel: string | null;
  readonly skippedCount: number;
  readonly rows: readonly ServiceAccountRowView[];
  /** Shown instead of the table when no row is left. */
  readonly emptyState?: ReactNode;
};

export type ServiceAccountsProps = {
  /** Keeps the rows whose name, address, network or balance contains it. */
  readonly searchValue?: string;
  readonly emptyState?: ReactNode;
};
