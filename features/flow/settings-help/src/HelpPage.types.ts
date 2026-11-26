import type { ReactNode } from "react";
import type { HelpPort } from "./ports";
import type { HelpSlots } from "./types";

export type HelpPageProps = Readonly<{
  port: HelpPort;
  /** Only desktop has `slot` rows. */
  slots?: HelpSlots;
  /** Rendered while a confirmation is open, so the app can pause its background work. */
  whileConfirming?: ReactNode;
  testID?: string;
}>;
