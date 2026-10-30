import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-rnative";
import type { AccountHeroBalance } from "../../hero/types";

type Props = Readonly<{ balance: AccountHeroBalance; testID?: string }>;

export function AccountBalance({ balance, testID }: Props) {
  const { countervalue, formatter, discreet, isLoading } = balance;
  if (countervalue === undefined && !isLoading) return null;

  return (
    <AmountDisplay
      value={countervalue ?? 0}
      formatter={formatter}
      hidden={discreet}
      loading={isLoading}
      testID={testID}
    />
  );
}
