import React from "react";
import { Box, Link, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { ArrowUp, Check, Copy, PenEdit, Share, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";

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
}: ContactAddressDetailActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Box lx={{ marginTop: "s16", gap: "s32", width: "full", alignItems: "center" }}>
      <Link
        size="sm"
        underline={false}
        icon={hasCopied ? Check : Copy}
        onPress={onCopy}
        testID="contacts-address-detail-copy"
      >
        {hasCopied ? t("contacts.addressDetail.copied") : t("contacts.addressDetail.copyAddress")}
      </Link>
      <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
        <TileButton
          icon={ArrowUp}
          disabled={!canSend || !onSend}
          onPress={onSend}
          isFull
          lx={{ flex: 1 }}
          numberOfLines={1}
        >
          {t("contacts.addressDetail.send")}
        </TileButton>
        <TileButton
          icon={PenEdit}
          disabled={!canEdit || !onEdit}
          onPress={onEdit}
          isFull
          lx={{ flex: 1 }}
          testID="contacts-address-detail-edit"
          numberOfLines={1}
        >
          {t("contacts.addressDetail.edit")}
        </TileButton>
        <TileButton
          icon={Share}
          disabled={!onShare}
          onPress={onShare}
          isFull
          lx={{ flex: 1 }}
          testID="contacts-address-detail-share"
          numberOfLines={1}
        >
          {t("contacts.addressDetail.share")}
        </TileButton>
        <TileButton
          icon={Trash}
          appearance="red"
          disabled={!canDelete || !onDelete}
          onPress={onDelete}
          isFull
          lx={{ flex: 1 }}
          testID="contacts-address-detail-delete"
          numberOfLines={1}
        >
          {t("contacts.addressDetail.delete")}
        </TileButton>
      </Box>
    </Box>
  );
}
