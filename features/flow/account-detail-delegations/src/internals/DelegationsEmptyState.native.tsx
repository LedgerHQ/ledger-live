import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import type { DelegationEmptyState } from "../components/AccountDelegations/AccountDelegations.types";

type Props = Readonly<{
  emptyState: DelegationEmptyState;
  onStartDelegating: () => void;
  onLearnMore?: () => void;
  testID?: string;
}>;

export const DelegationsEmptyState = ({
  emptyState: { description, learnMoreLabel, actionLabel, actionDisabled },
  onStartDelegating,
  onLearnMore,
  testID,
}: Props) => (
  <Banner
    appearance="info"
    description={description}
    primaryAction={
      <Button
        appearance="gray"
        size="sm"
        disabled={actionDisabled}
        onPress={actionDisabled ? undefined : onStartDelegating}
        testID={testID ? `${testID}-empty-action` : undefined}
      >
        {actionLabel}
      </Button>
    }
    secondaryAction={
      learnMoreLabel && onLearnMore ? (
        <Button appearance="no-background" size="sm" onPress={onLearnMore}>
          {learnMoreLabel}
        </Button>
      ) : undefined
    }
    testID={testID ? `${testID}-empty` : undefined}
  />
);
