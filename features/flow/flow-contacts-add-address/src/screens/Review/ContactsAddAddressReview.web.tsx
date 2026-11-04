import React from "react";
import { ContactsAddAddressReviewView } from "./ContactsAddAddressReviewView";
import type { ContactsAddAddressReviewProps } from "./types";
import { useContactsAddAddressReviewViewModel } from "./useContactsAddAddressReviewViewModel";

export function ContactsAddAddressReview(props: ContactsAddAddressReviewProps): React.JSX.Element {
  return <ContactsAddAddressReviewView {...useContactsAddAddressReviewViewModel(props)} />;
}
