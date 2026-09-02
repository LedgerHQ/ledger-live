import React from "react";
import { ContactAddressPickerView } from "./ContactAddressPickerView.web";
import type { ContactAddressPickerProps } from "../../types";

export function ContactAddressPicker(props: ContactAddressPickerProps) {
  return <ContactAddressPickerView {...props} />;
}
