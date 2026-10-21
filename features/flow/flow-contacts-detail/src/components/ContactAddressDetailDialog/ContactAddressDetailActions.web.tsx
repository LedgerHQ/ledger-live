import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { ArrowUp, Check, Copy, PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";

type ContactAddressDetailActionsProps = Readonly<{
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
  hasCopied,
  onCopy,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailActionsProps): React.ReactNode {
  const { t } = useTranslation();

  return (
    <div className="grid w-full grid-cols-4 gap-8">
      <TileButton
        icon={ArrowUp}
        isFull
        disabled={!canSend}
        onClick={onSend}
        data-testid="contacts-address-detail-send"
      >
        {t("contacts.addressDetail.send")}
      </TileButton>
      <TileButton
        icon={hasCopied ? Check : Copy}
        onClick={onCopy}
        data-testid="contacts-address-detail-copy"
        isFull
      >
        {hasCopied ? t("contacts.addressDetail.copied") : t("contacts.addressDetail.copy")}
      </TileButton>
      <TileButton
        icon={PenEdit}
        isFull
        disabled={!canEdit}
        onClick={onEdit}
        data-testid="contacts-address-detail-edit"
      >
        {t("contacts.addressDetail.edit")}
      </TileButton>
      <TileButton
        icon={Trash}
        appearance="red"
        data-testid="contacts-address-detail-delete"
        isFull
        disabled={!canDelete}
        onClick={onDelete}
      >
        {t("contacts.addressDetail.delete")}
      </TileButton>
    </div>
  );
}
