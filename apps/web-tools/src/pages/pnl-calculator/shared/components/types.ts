import type { CSSProperties, ReactNode } from "react";

export type PnlCardIcon = {
  /** `ledgerId` from `@ledgerhq/wallet-pnl/scenarios` exports (e.g. `BTC.id`). */
  ledgerId: string;
  ticker: string;
};

export type PnlStat = {
  /** Stable React key. Defaults to index when absent. */
  id?: string;
  label: ReactNode;
  value: ReactNode;
  tone?: CSSProperties;
};

export type PnlHeadline = {
  value: ReactNode;
  tone?: CSSProperties;
  sub?: { value: ReactNode; tone?: CSSProperties };
};

/**
 * `id` is required so `<label htmlFor>` can disambiguate fields with
 * colliding labels (e.g. three "Latest price" inputs on the multi-asset
 * card).
 */
export type PnlField =
  | {
      kind: "amount";
      id: string;
      label: string;
      value: string;
      currencySymbol: string;
      onChange: (next: string) => void;
    }
  | {
      kind: "switch";
      id: string;
      label: string;
      selected: boolean;
      onChange: (next: boolean) => void;
    };
