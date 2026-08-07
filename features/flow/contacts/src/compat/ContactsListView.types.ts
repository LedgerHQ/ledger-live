import type { ChangeEvent } from "react";
import type { ContactId } from "@domain/entity-contact";
import type { ContactsListViewLabels, ContactsPageViewModel } from "@features/flow-contacts-list";
import type { ContactDetailViewProps } from "../steps/Detail/types";
import type {
  ContactsFeatureIntroduction,
  ContactsLedgerSyncIntroduction,
} from "../steps/Introduction/types";
import type { ContactsLedgerSyncStatus } from "../ledgerSync";

type ContactsPageSharedProps = Readonly<{
  viewModel: ContactsPageViewModel;
  labels: ContactsListViewLabels;
  searchQuery: string;
  meAvatarSrc: string;
  onOpenContact: (contactId: ContactId) => void;
  onAddContact: () => void;
  ledgerSyncStatus: ContactsLedgerSyncStatus;
  featureIntroduction: ContactsFeatureIntroduction;
  ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
}>;

export type ContactsListViewProps = ContactsPageSharedProps &
  Readonly<{
    onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onOpenMe: (contactId: ContactId) => void;
    detail?: ContactDetailViewProps;
  }>;

export type ContactsListViewNativeProps = ContactsPageSharedProps &
  Readonly<{
    onSearchQueryChange: (query: string) => void;
  }>;
