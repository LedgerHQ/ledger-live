import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { DelegationHeaderAction } from "../components/AccountDelegations/AccountDelegations.types";

type Props = Readonly<{
  title: string;
  actions: readonly DelegationHeaderAction[];
  onSelectAction: (actionId: string) => void;
  testID?: string;
}>;

export const DelegationsHeader = ({ title, actions, onSelectAction, testID }: Props) => {
  const reasonId = (actionId: string) => `${testID ?? "delegations"}-reason-${actionId}`;

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-16">
        <h2 className="heading-4-semi-bold text-base">{title}</h2>
        <div className="flex items-center gap-8">
          {actions.map(({ id, label, disabledReason }) => (
            <Button
              key={id}
              appearance="gray"
              size="sm"
              disabled={disabledReason !== undefined}
              aria-describedby={disabledReason ? reasonId(id) : undefined}
              onClick={() => onSelectAction(id)}
              data-testid={testID ? `${testID}-header-action-${id}` : undefined}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      {actions.map(({ id, disabledReason }) =>
        disabledReason ? (
          <p key={id} id={reasonId(id)} className="body-3 text-muted">
            {disabledReason}
          </p>
        ) : null,
      )}
    </header>
  );
};
