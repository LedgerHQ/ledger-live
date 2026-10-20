type Target = { readonly kind: string; readonly accountUUID: string; readonly requestId: string };

/** One thing that happened in the account data layer, oldest first. */
export type AccountDataToolEvent = { readonly id: number; readonly at: number } & (
  | (Target & { readonly type: "requested"; readonly queryKey: string; readonly append: boolean })
  | (Target & {
      readonly type: "received";
      readonly sourceId: string;
      readonly append: boolean;
      readonly hasMore: boolean;
      readonly elapsedMs?: number;
    })
  | (Target & { readonly type: "failed"; readonly error: string; readonly elapsedMs?: number })
  | {
      /** A call the router made on a source, for one account or a batch. */
      readonly type: "source-call";
      readonly sourceId: string;
      readonly kind: string;
      readonly batch: boolean;
      readonly accounts: number;
      readonly failed: number;
      readonly elapsedMs: number;
    }
);

/** How the reads of one kind of one account stand. */
export interface AccountDataToolStatus {
  readonly kind: string;
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the account. */
  readonly descriptor?: string;
  readonly reading?: "head" | "next page";
  readonly error?: string;
  readonly sourceId?: string;
  readonly queryKey?: string;
  readonly readAt?: number;
  readonly hasMore: boolean;
}

export interface AccountDataToolProps {
  readonly statuses: readonly AccountDataToolStatus[];
  readonly events: readonly AccountDataToolEvent[];
  /** Below this age, a head read is fresh and not repeated. */
  readonly maxAge: number;
  readonly onClearEvents: () => void;
}
