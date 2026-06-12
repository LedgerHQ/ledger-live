import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { EditNameView } from "./EditNameView";
import { useEditNameViewModel } from "./useEditNameViewModel";

export const EditName = ({
  account,
  children,
}: {
  account: AccountLike;
  children: React.ReactNode;
}) => {
  return <EditNameView {...useEditNameViewModel({ account })}>{children}</EditNameView>;
};
