import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AddressList } from "./AddressList";

export type AllAddressesDialogProps = Readonly<{
  open: boolean;
  title: string;
  description: string;
  sortedAccounts: AccountLike[];
  lookupParentAccount: (id: string) => Account | undefined | null;
  onAccountClick: (account: AccountLike, parentAccount?: Account | null) => void;
  onOpenChange: (open: boolean) => void;
}>;

export function AllAddressesDialog({
  open,
  title,
  description,
  sortedAccounts,
  lookupParentAccount,
  onAccountClick,
  onOpenChange,
}: AllAddressesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="asset-detail-all-addresses-dialog">
        <DialogHeader
          density="expanded"
          title={title}
          description={description}
          onClose={() => onOpenChange(false)}
        />
        <DialogBody className="max-h-[60vh] min-h-0 overflow-y-auto">
          <AddressList
            sortedAccounts={sortedAccounts}
            lookupParentAccount={lookupParentAccount}
            onAccountClick={onAccountClick}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
