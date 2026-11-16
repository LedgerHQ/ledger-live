import React from "react";
import {
  StakePositionSurface,
  StakePositionUnavailable,
  type StakePositionHeading,
} from "@features/flow-stake-position";
import {
  useStakePositionDialogRootViewModel,
  type StakePositionDialogRootViewModel,
} from "./useStakePositionDialogRootViewModel";

const DETAILS_HEADING: StakePositionHeading = { kind: "details" };

function StakePositionDialogRootView(props: StakePositionDialogRootViewModel) {
  switch (props.kind) {
    case "hidden":
      return null;
    case "accountRemoved":
      return (
        <StakePositionSurface
          isOpen={props.isOpen}
          heading={DETAILS_HEADING}
          ticker={props.ticker}
          onDismiss={props.onDismiss}
          isDismissible
        >
          <StakePositionUnavailable reason="notFound" onDismiss={props.onDismiss} />
        </StakePositionSurface>
      );
    case "position": {
      const { Content, account, request, phase, onEarnMore } = props;
      return (
        <Content
          key={request.id}
          account={account}
          request={request}
          phase={phase}
          onEarnMore={onEarnMore}
        />
      );
    }
  }
}

export default function StakePositionDialogRoot() {
  return <StakePositionDialogRootView {...useStakePositionDialogRootViewModel()} />;
}
