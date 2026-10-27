import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { FamilySectionView } from "./FamilySectionView";
import { useFamilySectionViewModel } from "./useFamilySectionViewModel";

type Props = Readonly<{ account: Account }>;

export function FamilySection({ account }: Props) {
  return <FamilySectionView {...useFamilySectionViewModel(account)} />;
}
