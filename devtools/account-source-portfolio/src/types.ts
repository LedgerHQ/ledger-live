/** How the last balance read of an account through the source went. */
export interface PortfolioSourceToolOutcome {
  readonly status: "served" | "waiting" | "failed";
  readonly detail?: string;
  readonly rows: number;
  readonly at: number;
}

/** A local account, as the Portfolio source sees it. */
export interface PortfolioSourceToolAccount {
  readonly accountUUID: string;
  readonly label: string;
  /** False when the source does not support it (not an EVM account). */
  readonly supported: boolean;
  /** The service lists its registration. */
  readonly registered: boolean;
  /** The id the service gives it, with its status when the service lists it. */
  readonly serverAccountId?: string;
  readonly serverStatus?: string;
  readonly outcome?: PortfolioSourceToolOutcome;
}

/** A registration the service holds and no local account needs: Reconcile removes it. */
export interface PortfolioSourceToolExtraRegistration {
  readonly id: string;
  readonly type: string;
  readonly label: string;
}

export interface PortfolioSourceToolActivity {
  readonly id: number;
  readonly at: number;
  readonly ok: boolean;
  readonly summary: string;
}

export interface PortfolioSourceToolProps {
  /** Empty when the service is not configured. */
  readonly serviceUrl: string;
  readonly enabled: boolean;
  readonly listedAt?: number;
  readonly accounts: readonly PortfolioSourceToolAccount[];
  readonly extraRegistrations: readonly PortfolioSourceToolExtraRegistration[];
  readonly activity: readonly PortfolioSourceToolActivity[];
  readonly busy: boolean;
  readonly onToggleEnabled: (enabled: boolean) => void;
  readonly onRefresh: () => void;
  readonly onReconcile: () => void;
}
