import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { EditNameView } from "./EditNameView";
import { useEditNameViewModel } from "./useEditNameViewModel";

export const EditName = ({
  account,
  asset,
  children,
}: {
  account: AccountLike;
  asset: string;
  children: React.ReactNode;
}) => {
  return <EditNameView {...useEditNameViewModel({ account, asset })}>{children}</EditNameView>;
};
