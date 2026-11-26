import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import type { HelpPageProps } from "./HelpPage.types";
import { HelpView } from "./HelpView";
import { useHelpViewModel } from "./useHelpViewModel";

/** The Help page of the new Settings. The app provides its `port` and `slots`. */
export function HelpPage({ port, slots, whileConfirming, testID }: HelpPageProps) {
  const { confirmationScreenName, ...viewModel } = useHelpViewModel(port);
  return (
    <>
      <TrackScreen category="Settings" name="Help" />
      {confirmationScreenName ? (
        <TrackScreen category="Modal" name={confirmationScreenName} />
      ) : null}
      <HelpView {...viewModel} slots={slots} whileConfirming={whileConfirming} testID={testID} />
    </>
  );
}
