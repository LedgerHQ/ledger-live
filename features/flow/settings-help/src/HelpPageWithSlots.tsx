import React from "react";
import type { HelpPageProps } from "./HelpPage.types";
import { HelpPageCore } from "./HelpPageCore";
import type { HelpSlots } from "./types";

export type HelpPageWithSlotsProps = HelpPageProps & Readonly<{ slots: HelpSlots }>;

/** The desktop Help page, whose `slot` rows render legacy components the app owns. */
export function HelpPageWithSlots({
  port,
  slots,
  whileConfirming,
  testID,
}: HelpPageWithSlotsProps) {
  return (
    <HelpPageCore port={port} slots={slots} whileConfirming={whileConfirming} testID={testID} />
  );
}
