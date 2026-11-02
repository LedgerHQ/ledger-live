import React from "react";
import { AccountActions } from "../components/AccountActions/AccountActions.web";
import { AccountBalance } from "../components/AccountBalance/AccountBalance.web";
import type { AccountHeroPort } from "./types";
import { useAccountHeroViewModel } from "./useAccountHeroViewModel";

type Props = AccountHeroPort & Readonly<{ testID?: string }>;

export function AccountHero({ testID, ...port }: Props) {
  const { balance, actions, onActionPress } = useAccountHeroViewModel(port);

  return (
    <section className="flex flex-col gap-24" data-testid={testID}>
      <AccountBalance balance={balance} testID={testID && `${testID}-balance`} />
      <AccountActions
        actions={actions}
        onActionPress={onActionPress}
        testID={testID && `${testID}-actions`}
      />
    </section>
  );
}
