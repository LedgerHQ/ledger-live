import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import type { HelpPageProps } from "./HelpPage.types";
import { HelpView } from "./HelpView";
import type { HelpSlots } from "./types";
import { useHelpViewModel } from "./useHelpViewModel";

const NO_SLOTS: HelpSlots = {};

/** The Help page of the new Settings and of My Wallet. The app provides its `port` and `slots`. */
export function HelpPage({ port, slots = NO_SLOTS, whileConfirming, testID }: HelpPageProps) {
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
