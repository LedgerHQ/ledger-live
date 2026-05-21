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
    <Dialog open={open} onOpenChange={onOpenChange} height="fixed">
      <DialogContent data-testid="asset-detail-all-addresses-dialog">
        <DialogHeader
          density="expanded"
          title={title}
          description={description}
          onClose={() => onOpenChange(false)}
        />
        <DialogBody>
          <div className="-mx-8 flex flex-col gap-4">
            <AddressList
              testId="asset-detail-all-addresses-list"
              sortedAccounts={sortedAccounts}
              lookupParentAccount={lookupParentAccount}
              onAccountClick={onAccountClick}
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
