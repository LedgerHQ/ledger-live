import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { AccountActions } from "../components/AccountActions/AccountActions";
import { AccountBalance } from "../components/AccountBalance/AccountBalance";
import type { AccountHeroPort } from "./types";
import { useAccountHeroViewModel } from "./useAccountHeroViewModel";

type Props = AccountHeroPort & Readonly<{ testID?: string }>;

export function AccountHero({ testID, ...port }: Props) {
  const { balance, tag, actions, onActionPress } = useAccountHeroViewModel(port);

  return (
    <section className="flex flex-col gap-24" data-testid={testID}>
      <div className="flex flex-col items-start gap-8">
        {tag ? (
          <Tag label={tag} size="sm" appearance="gray" data-testid={testID && `${testID}-tag`} />
        ) : null}
        <AccountBalance balance={balance} testID={testID && `${testID}-balance`} />
      </div>
      <AccountActions
        actions={actions}
        onActionPress={onActionPress}
        testID={testID && `${testID}-actions`}
      />
    </section>
  );
}
