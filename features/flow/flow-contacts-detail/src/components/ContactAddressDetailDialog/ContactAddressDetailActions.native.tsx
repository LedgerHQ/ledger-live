import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Link,
  type IconProps,
} from "@ledgerhq/lumen-ui-rnative";
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

type ActionCardProps = Readonly<{
  icon: React.ComponentType<IconProps>;
  label: string;
  disabled: boolean;
  onPress?: () => void;
  isDestructive?: boolean;
  testID: string;
}>;

function ActionCard({
  icon: Icon,
  label,
  disabled,
  onPress,
  isDestructive = false,
  testID,
}: ActionCardProps): React.JSX.Element {
  const showsDestructiveColor = isDestructive && !disabled;

  return (
    <Card type="interactive" disabled={disabled} onPress={onPress} lx={{ flex: 1 }} testID={testID}>
      <CardHeader>
        <CardLeading>
          <Icon size={24} disabled={disabled} color={showsDestructiveColor ? "error" : undefined} />
          <CardContent>
            <CardContentTitle
              numberOfLines={1}
              lx={showsDestructiveColor ? { color: "error" } : undefined}
            >
              {label}
            </CardContentTitle>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}

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
      <Box lx={{ gap: "s8", width: "full" }}>
        <Box lx={{ flexDirection: "row", gap: "s8" }}>
          <ActionCard
            icon={ArrowUp}
            label={t("contacts.addressDetail.send")}
            disabled={!canSend || !onSend}
            onPress={onSend}
            testID="contacts-address-detail-send"
          />
          <ActionCard
            icon={PenEdit}
            label={t("contacts.addressDetail.edit")}
            disabled={!canEdit || !onEdit}
            onPress={onEdit}
            testID="contacts-address-detail-edit"
          />
        </Box>
        <Box lx={{ flexDirection: "row", gap: "s8" }}>
          <ActionCard
            icon={Share}
            label={t("contacts.addressDetail.share")}
            disabled={!onShare}
            onPress={onShare}
            testID="contacts-address-detail-share"
          />
          <ActionCard
            icon={Trash}
            label={t("contacts.addressDetail.delete")}
            disabled={!canDelete || !onDelete}
            onPress={onDelete}
            isDestructive
            testID="contacts-address-detail-delete"
          />
        </Box>
      </Box>
    </Box>
  );
}
