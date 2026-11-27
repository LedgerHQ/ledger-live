import React from "react";
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  type IconProps,
} from "@ledgerhq/lumen-ui-react";
import { ArrowUp, Check, Copy, PenEdit, Share, Trash } from "@ledgerhq/lumen-ui-react/symbols";
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
  icon: React.ComponentType<Omit<IconProps, "children">>;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  isDestructive?: boolean;
  testId: string;
}>;

function ActionCard({
  icon: Icon,
  label,
  disabled = false,
  onClick,
  isDestructive = false,
  testId,
}: ActionCardProps): React.ReactNode {
  const destructiveClassName = isDestructive && !disabled ? "text-error" : undefined;

  return (
    <Card
      type="interactive"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className="min-w-0"
      data-testid={testId}
    >
      <CardHeader>
        <CardLeading className="min-w-0">
          <Icon size={24} disabled={disabled} className={destructiveClassName} />
          <CardContent className="min-w-0">
            <CardContentTitle className={destructiveClassName ? "truncate text-error" : "truncate"}>
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
}: ContactAddressDetailActionsProps): React.ReactNode {
  const { t } = useTranslation();

  return (
    <div className="grid w-full grid-cols-2 gap-8">
      <ActionCard
        icon={ArrowUp}
        label={t("contacts.addressDetail.send")}
        disabled={!canSend}
        onClick={onSend}
        testId="contacts-address-detail-send"
      />
      <ActionCard
        icon={hasCopied ? Check : Copy}
        label={hasCopied ? t("contacts.addressDetail.copied") : t("contacts.addressDetail.copy")}
        onClick={onCopy}
        testId="contacts-address-detail-copy"
      />
      <ActionCard
        icon={PenEdit}
        label={t("contacts.addressDetail.edit")}
        disabled={!canEdit}
        onClick={onEdit}
        testId="contacts-address-detail-edit"
      />
      <ActionCard
        icon={Trash}
        label={t("contacts.addressDetail.delete")}
        disabled={!canDelete}
        onClick={onDelete}
        isDestructive
        testId="contacts-address-detail-delete"
      />
      {onShare ? (
        <ActionCard
          icon={Share}
          label={t("contacts.addressDetail.share")}
          onClick={onShare}
          testId="contacts-address-detail-share"
        />
      ) : null}
    </div>
  );
}
