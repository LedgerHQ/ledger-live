import type { ChangeEvent } from "react";
import type { ContactId } from "@domain/entity-contact";
import type {
  ContactsListViewLabels,
  ContactsPageViewModel,
} from "@features/flow-contacts-list/native";
import type {
  ContactsFeatureIntroduction,
  ContactsLedgerSyncIntroduction,
  ContactsLedgerSyncStatus,
} from "@features/flow-contacts-introduction";
import type { ContactDetailViewProps } from "./steps/Detail/types";

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

export type ContactsViewProps = ContactsPageSharedProps &
  Readonly<{
    onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onOpenMe: (contactId: ContactId) => void;
    detail?: ContactDetailViewProps;
  }>;

export type ContactsViewNativeProps = ContactsPageSharedProps &
  Readonly<{
    onSearchQueryChange: (query: string) => void;
  }>;
