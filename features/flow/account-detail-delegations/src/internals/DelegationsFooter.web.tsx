import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { DelegationFooter } from "../components/AccountDelegations/AccountDelegations.types";

type Props = Readonly<{
  footer: DelegationFooter;
  onSelectAction?: () => void;
  testID?: string;
}>;

export const DelegationsFooter = ({
  footer: { title, description, actionLabel, actionDisabled },
  onSelectAction,
  testID,
}: Props) => (
  <Banner
    appearance="info"
    title={title}
    description={description}
    primaryAction={
      actionLabel ? (
        <Button appearance="gray" size="sm" disabled={actionDisabled} onClick={onSelectAction}>
          {actionLabel}
        </Button>
      ) : undefined
    }
    data-testid={testID ? `${testID}-footer` : undefined}
  />
);
