import React from "react";
import { View } from "react-native";
import { ContactsAddAddressEntry } from "../ContactsAddAddressEntry.native";
import type { ContactsAddAddressEntryProps } from "../ContactsAddAddressEntry.types";
import { ContactsAddAddressName } from "../AddressName/ContactsAddAddressName.native";
import type { ContactsAddAddressNameNativeProps } from "../AddressName/types";

const STEP_FRAME_HEIGHT = "100%";

export type ContactsAddAddressNativeFlowStep = "address" | "name";

export type ContactsAddAddressFlowContentProps = Readonly<{
  step: ContactsAddAddressNativeFlowStep;
  addressEntryProps: ContactsAddAddressEntryProps | null;
  addressNameProps: ContactsAddAddressNameNativeProps | null;
}>;

function ContactsAddAddressStepFrame({ children }: React.PropsWithChildren): React.JSX.Element {
  return (
    <View testID="contacts-add-address-step-frame" style={{ height: STEP_FRAME_HEIGHT }}>
      {children}
    </View>
  );
}

export function ContactsAddAddressFlowContent({
  step,
  addressEntryProps,
  addressNameProps,
}: ContactsAddAddressFlowContentProps): React.JSX.Element | null {
  switch (step) {
    case "address":
      return addressEntryProps ? (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressEntry {...addressEntryProps} />
        </ContactsAddAddressStepFrame>
      ) : null;
    case "name":
      return addressNameProps ? (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressName {...addressNameProps} />
        </ContactsAddAddressStepFrame>
      ) : null;
  }
}
