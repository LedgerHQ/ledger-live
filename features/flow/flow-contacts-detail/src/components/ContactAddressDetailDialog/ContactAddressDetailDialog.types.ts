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
  /** Hands the address to the host's share sheet. The share action shows only when it is set. */
  onShareAddress?: (address: string) => void;
  canSend?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}>;
