import type { Contact, ContactAddress, ContactAddressId, ContactId } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactEditRequirement } from "./model/editRequirement";

export type ContactDetailAddressRowIntent = Readonly<{
  type: "open-address-detail";
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactDetailEditSignerValidationLookup = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactDetailEditIntent = Readonly<{
  type: "edit-contact";
  contactId: ContactId;
  editRequirement: ContactEditRequirement;
  signerValidationLookup?: ContactDetailEditSignerValidationLookup;
}>;

export type ContactDetailLedgerWalletAccountsIntent = Readonly<{
  type: "open-ledger-wallet-accounts";
}>;

export type ContactDetailActionsViewModel = Readonly<{
  editIntent: ContactDetailEditIntent | undefined;
  isSignerRequiredForEdit: boolean;
}>;

export type ContactDetailAddressRow = Readonly<{
  addressId: ContactAddressId;
  label: ContactAddress["label"];
  address: ContactAddress["address"];
  currencyId: ContactAddress["currencyId"];
  intent: ContactDetailAddressRowIntent;
}>;

export type ContactDetailAddressNetworkGroup = Readonly<{
  networkId: CryptoCurrency["id"];
  networkName: string;
  networkTicker: string;
  rows: readonly ContactDetailAddressRow[];
}>;

export type PopulatedContactDetailViewModel = Readonly<{
  displayMode: "populated";
  contact: Contact;
  addressCount: number;
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
}>;

export type ContactDetailViewProps = Readonly<{
  contact: Contact;
  onAddAddress: () => void;
  ledgerWalletAccountsIntent?: ContactDetailLedgerWalletAccountsIntent;
  onLedgerWalletAccountsPress?: (intent: ContactDetailLedgerWalletAccountsIntent) => void;
  addressGroups?: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress?: (intent: ContactDetailAddressRowIntent) => void;
  detailActions?: Readonly<{
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
  }>;
}>;

export type ContactAddressDetailAsset = Readonly<{
  currencyId: ContactAddress["currencyId"];
  name: string;
  ticker: string;
}>;

export type ContactAddressDetailNetwork = Readonly<{
  id: CryptoCurrency["id"];
  name: string;
}>;

export type ContactAddressDetailViewModel =
  | Readonly<{ displayMode: "not-found" }>
  | Readonly<{
      displayMode: "found";
      address: ContactAddress["address"];
      label: ContactAddress["label"];
      network: ContactAddressDetailNetwork;
      asset: ContactAddressDetailAsset;
      qrPayload: string;
    }>;

export type ContactAddressDetailSendIntent = Readonly<{
  type: "send-address";
  contactId: ContactId;
  addressId: ContactAddressId;
  currencyId: ContactAddress["currencyId"];
  address: ContactAddress["address"];
}>;

export type ContactAddressDetailEditIntent = Readonly<{
  type: "edit-address";
  contactId: ContactId;
  addressId: ContactAddressId;
  editRequirement: ContactEditRequirement;
}>;

export type ContactAddressDetailActionsViewModel = Readonly<{
  sendIntent: ContactAddressDetailSendIntent | undefined;
  editIntent: ContactAddressDetailEditIntent | undefined;
  isSignerRequiredForEdit: boolean;
}>;
