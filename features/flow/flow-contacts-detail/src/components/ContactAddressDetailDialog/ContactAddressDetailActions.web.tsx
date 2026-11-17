import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { ArrowUp, Check, Copy, PenEdit, Share, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";

const SINGLE_LINE_LABEL_CLASS_NAME =
  "min-w-0 px-2 [&>span]:block [&>span]:w-full [&>span]:truncate";

type ContactAddressDetailActionsProps = Readonly<{
  hasCopied: boolean;
  onCopy: () => void;
  onShare?: () => void;
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
  onShare,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailActionsProps): React.ReactNode {
  const { t } = useTranslation();
  const sendLabel = t("contacts.addressDetail.send");
  const copyLabel = hasCopied
    ? t("contacts.addressDetail.copied")
    : t("contacts.addressDetail.copy");
  const editLabel = t("contacts.addressDetail.edit");
  const shareLabel = t("contacts.addressDetail.share");
  const deleteLabel = t("contacts.addressDetail.delete");

  return (
    <div className={`grid w-full gap-8 ${onShare ? "grid-cols-5" : "grid-cols-4"}`}>
      <TileButton
        icon={ArrowUp}
        isFull
        className={SINGLE_LINE_LABEL_CLASS_NAME}
        title={sendLabel}
        disabled={!canSend}
        onClick={onSend}
        data-testid="contacts-address-detail-send"
      >
        {sendLabel}
      </TileButton>
      <TileButton
        icon={hasCopied ? Check : Copy}
        onClick={onCopy}
        data-testid="contacts-address-detail-copy"
        isFull
        className={SINGLE_LINE_LABEL_CLASS_NAME}
        title={copyLabel}
      >
        {copyLabel}
      </TileButton>
      <TileButton
        icon={PenEdit}
        isFull
        className={SINGLE_LINE_LABEL_CLASS_NAME}
        title={editLabel}
        disabled={!canEdit}
        onClick={onEdit}
        data-testid="contacts-address-detail-edit"
      >
        {editLabel}
      </TileButton>
      {onShare ? (
        <TileButton
          icon={Share}
          isFull
          className={SINGLE_LINE_LABEL_CLASS_NAME}
          title={shareLabel}
          onClick={onShare}
          data-testid="contacts-address-detail-share"
        >
          {shareLabel}
        </TileButton>
      ) : null}
      <TileButton
        icon={Trash}
        appearance="red"
        data-testid="contacts-address-detail-delete"
        isFull
        className={SINGLE_LINE_LABEL_CLASS_NAME}
        title={deleteLabel}
        disabled={!canDelete}
        onClick={onDelete}
      >
        {deleteLabel}
      </TileButton>
    </div>
  );
}
