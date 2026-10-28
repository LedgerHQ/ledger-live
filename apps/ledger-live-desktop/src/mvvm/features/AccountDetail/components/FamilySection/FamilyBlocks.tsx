import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { FamilyBlocksView } from "./FamilyBlocksView";
import { useFamilyBlocksViewModel } from "./useFamilyBlocksViewModel";

type Props = Readonly<{ account: Account; currencyConfig: CurrencyConfig | undefined }>;

export const FamilyBlocks = ({ account, currencyConfig }: Props) => {
  return <FamilyBlocksView {...useFamilyBlocksViewModel(account, currencyConfig)} />;
};
