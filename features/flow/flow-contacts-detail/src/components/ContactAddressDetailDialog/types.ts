import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRow } from "../../types";

export type ContactAddressDetailDialogProps = Readonly<{
  isOpen: boolean;
  contactName: string;
  row: ContactDetailAddressRow | undefined;
  network: ContactDetailAddressNetworkGroup | undefined;
  onClose: () => void;
  onSend?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canSend?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}>;

export type ContactAddressDetailDialogNativeProps = ContactAddressDetailDialogProps &
  Readonly<{
    bottomInset?: number;
    onCopyAddress?: (address: string) => Promise<boolean>;
    onShareAddress?: (address: string) => void;
  }>;
