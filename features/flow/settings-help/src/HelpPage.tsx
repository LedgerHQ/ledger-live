import React from "react";
import type { HelpPageProps } from "./HelpPage.types";
import { HelpPageCore } from "./HelpPageCore";

/** The Help page of the new Settings and of My Wallet. The app provides its `port`. */
export function HelpPage({ port, whileConfirming, testID }: HelpPageProps) {
  return <HelpPageCore port={port} whileConfirming={whileConfirming} testID={testID} />;
}
