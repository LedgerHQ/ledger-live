import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import {
  ArrowUp,
  Check,
  Copy,
  PenEdit,
  Trash,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactAddressDetailDialogLabels } from "./types";

type ContactAddressDetailActionsProps = Readonly<{
  labels: ContactAddressDetailDialogLabels;
  hasCopied: boolean;
  onCopy: () => void;
}>;

export function ContactAddressDetailActions({
  labels,
  hasCopied,
  onCopy,
}: ContactAddressDetailActionsProps): React.ReactNode {
  return (
    <div className="grid w-full grid-cols-4 gap-8">
      <TileButton icon={ArrowUp} isFull disabled>
        {labels.send}
      </TileButton>
      <TileButton
        icon={hasCopied ? Check : Copy}
        onClick={onCopy}
        data-testid="contacts-address-detail-copy"
        isFull
      >
        {hasCopied ? labels.copied : labels.copy}
      </TileButton>
      <TileButton icon={PenEdit} isFull disabled>
        {labels.edit}
      </TileButton>
      <TileButton
        icon={Trash}
        appearance="red"
        data-testid="contacts-address-detail-delete"
        isFull
        disabled
      >
        {labels.delete}
      </TileButton>
    </div>
  );
}
