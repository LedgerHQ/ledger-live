import type { ReactNode } from "react";
import type { HelpItemId } from "./logic/helpItems";

/** Rendered by the app for the `slot` rows, which run legacy components with their own modal. */
export type HelpSlots = Readonly<Partial<Record<HelpItemId, ReactNode>>>;
