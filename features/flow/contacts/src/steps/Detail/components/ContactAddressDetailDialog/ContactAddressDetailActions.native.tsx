import React from "react";
import { Box, Link, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { ArrowUp, Check, Copy, PenEdit, Share, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ContactAddressDetailDialogNativeLabels } from "./types";

type ContactAddressDetailActionsProps = Readonly<{
  labels: ContactAddressDetailDialogNativeLabels;
  hasCopied: boolean;
  onCopy: () => void;
  onSend?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canSend?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}>;

export function ContactAddressDetailActions({
  labels,
  hasCopied,
  onCopy,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailActionsProps): React.JSX.Element {
  return (
    <Box lx={{ marginTop: "s16", gap: "s32", width: "full", alignItems: "center" }}>
      <Link
        size="sm"
        underline={false}
        icon={hasCopied ? Check : Copy}
        onPress={onCopy}
        testID="contacts-address-detail-copy"
      >
        {hasCopied ? labels.copied : labels.copyAddress}
      </Link>
      <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
        <TileButton
          icon={ArrowUp}
          disabled={!canSend || !onSend}
          onPress={onSend}
          isFull
          lx={{ flex: 1 }}
        >
          {labels.send}
        </TileButton>
        <TileButton
          icon={PenEdit}
          disabled={!canEdit || !onEdit}
          onPress={onEdit}
          isFull
          lx={{ flex: 1 }}
          testID="contacts-address-detail-edit"
        >
          {labels.edit}
        </TileButton>
        <TileButton icon={Share} disabled isFull lx={{ flex: 1 }}>
          {labels.share}
        </TileButton>
        <TileButton
          icon={Trash}
          appearance="red"
          disabled={!canDelete || !onDelete}
          onPress={onDelete}
          isFull
          lx={{ flex: 1 }}
          testID="contacts-address-detail-delete"
        >
          {labels.delete}
        </TileButton>
      </Box>
    </Box>
  );
}
