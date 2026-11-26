import type { ReactNode } from "react";
import type { HelpPort } from "./ports";

export type HelpPageProps = Readonly<{
  port: HelpPort;
  /** Rendered while a confirmation is open, so the app can pause its background work. */
  whileConfirming?: ReactNode;
  testID?: string;
}>;
