import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import type { HelpPageProps } from "./HelpPage.types";
import { HelpView } from "./HelpView";
import type { HelpSlots } from "./types";
import { useHelpViewModel } from "./useHelpViewModel";

const NO_SLOTS: HelpSlots = {};

export type HelpPageCoreProps = HelpPageProps & Readonly<{ slots?: HelpSlots }>;

export function HelpPageCore({
  port,
  slots = NO_SLOTS,
  whileConfirming,
  testID,
}: HelpPageCoreProps) {
  const { screen, confirmationScreenName, ...viewModel } = useHelpViewModel(port);
  return (
    <>
      <TrackScreen category={screen.category} name={screen.name} />
      {confirmationScreenName ? (
        <TrackScreen category="Modal" name={confirmationScreenName} />
      ) : null}
      <HelpView {...viewModel} slots={slots} whileConfirming={whileConfirming} testID={testID} />
    </>
  );
}
