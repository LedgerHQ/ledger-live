import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { EditNameView } from "./EditNameView";
import { useEditNameViewModel } from "./useEditNameViewModel";

type EditNameProps = {
  account: AccountLike;
  asset: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSyncing: boolean;
};

export const EditName = ({ account, asset, open, onOpenChange, isSyncing }: EditNameProps) => {
  return (
    <EditNameView
      {...useEditNameViewModel({ account, asset })}
      open={open}
      onOpenChange={onOpenChange}
      isSyncing={isSyncing}
    />
  );
};
