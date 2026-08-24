import React from "react";
import { ContactsAddAddressReviewView } from "./ContactsAddAddressReviewView.web";
import type { ContactsAddAddressReviewProps } from "./types";
import { useContactsAddAddressReviewViewModel } from "./useContactsAddAddressReviewViewModel.web";

export function ContactsAddAddressReview(props: ContactsAddAddressReviewProps): React.JSX.Element {
  return <ContactsAddAddressReviewView {...useContactsAddAddressReviewViewModel(props)} />;
}
