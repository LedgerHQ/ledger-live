import type { Contact } from "@domain/entity-contact";
import type {
  ContactDetailAddressNetworkGroup,
  ContactDetailAddressRowIntent,
  ContactDetailLedgerWalletAccountsIntent,
} from "./types";

export type ContactDetailViewProps = Readonly<{
  contact: Contact;
  onAddAddress: () => void;
  ledgerWalletAccountsIntent?: ContactDetailLedgerWalletAccountsIntent;
  onOpenLedgerWalletAccounts?: (intent: ContactDetailLedgerWalletAccountsIntent) => void;
  addressGroups?: readonly ContactDetailAddressNetworkGroup[];
  onOpenAddressDetail?: (intent: ContactDetailAddressRowIntent) => void;
  /** Edit and delete actions shown in the header. Mobile shows them in its navigation header instead, so the native view does not render them. */
  detailActions?: Readonly<{ canDelete: boolean; onEdit: () => void; onDelete: () => void }>;
}>;
