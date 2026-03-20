import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { EditNameView } from "./EditNameView";
import { useEditNameViewModel } from "./useEditNameViewModel";

export const EditName = ({
  account,
  asset,
  children,
}: {
  account: Account;
  asset: string;
  children: React.ReactNode;
}) => {
  return <EditNameView {...useEditNameViewModel({ account, asset })}>{children}</EditNameView>;
};
