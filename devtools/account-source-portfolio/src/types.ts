/** One service account the registration of a local account gave. */
export interface PortfolioSourceToolServerAccount {
  readonly id: string;
  readonly status: string;
}

/** A local account, as the Portfolio source sees it. */
export interface PortfolioSourceToolAccount {
  readonly accountUUID: string;
  readonly label: string;
  /** The registration it needs, as JSON; absent when no strategy covers it. */
  readonly registration?: string;
  /** The service lists that registration. */
  readonly registered: boolean;
  readonly serverAccounts: readonly PortfolioSourceToolServerAccount[];
  /** How its last balance read through the source went. */
  readonly outcome?: {
    readonly outcome: "ok" | "pending" | "failed";
    readonly detail?: string;
    readonly rows: number;
    readonly at: number;
  };
}

/** A registration the service holds and no local account needs: a reconcile removes it. */
export interface PortfolioSourceToolExtraRegistration {
  readonly id: string;
  readonly type: string;
  readonly label: string;
}

export interface PortfolioSourceToolActivity {
  readonly id: number;
  readonly at: number;
  readonly kind: string;
  readonly ok: boolean;
  readonly summary: string;
  readonly durationMs?: number;
}

export interface PortfolioSourceToolProps {
  /** Empty when the service is not configured: the source is then left out of the router. */
  readonly serviceUrl: string;
  readonly enabled: boolean;
  /** When the service last listed the portfolio. */
  readonly listedAt?: number;
  /** Service accounts by status, across the portfolio. */
  readonly serverStatuses: readonly { readonly status: string; readonly count: number }[];
  readonly accounts: readonly PortfolioSourceToolAccount[];
  readonly extraRegistrations: readonly PortfolioSourceToolExtraRegistration[];
  readonly activity: readonly PortfolioSourceToolActivity[];
  readonly busy: boolean;
  readonly onToggleEnabled: (enabled: boolean) => void;
  /** Lists the portfolio again. */
  readonly onRefresh: () => void;
  /** Registers what is missing and removes what no account needs. */
  readonly onReconcile: () => void;
  readonly onClearActivity: () => void;
}
