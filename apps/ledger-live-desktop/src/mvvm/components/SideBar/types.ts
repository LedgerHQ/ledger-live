import type { RefObject } from "react";
import type { SideBarActiveValue } from "./utils";

export interface SideBarViewModel {
  readonly navRef: RefObject<HTMLElement | null>;
  readonly collapsed: boolean;
  readonly earnLabel: string;
  readonly isCardDisabled: boolean;
  readonly isPayTabEnabled: boolean;
  readonly isAccountsDisabled: boolean;
  readonly handleCollapsedChange: (collapsed: boolean) => void;
  /** Current active sidebar value. Empty string when no item matches. */
  readonly active: SideBarActiveValue;
  readonly handleActiveChange: (value: string) => void;
}
