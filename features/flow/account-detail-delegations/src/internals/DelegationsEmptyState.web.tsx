import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
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
        onClick={onStartDelegating}
        data-testid={testID ? `${testID}-empty-action` : undefined}
      >
        {actionLabel}
      </Button>
    }
    secondaryAction={
      learnMoreLabel && onLearnMore ? (
        <Button appearance="no-background" size="sm" icon={ExternalLink} onClick={onLearnMore}>
          {learnMoreLabel}
        </Button>
      ) : undefined
    }
    data-testid={testID ? `${testID}-empty` : undefined}
  />
);
