import React from "react";
import { View } from "react-native";
import { ContactsAddAddressEntry } from "../ContactsAddAddressEntry.native";
import type { ContactsAddAddressEntryProps } from "../ContactsAddAddressEntry.types";
import { ContactsAddAddressName } from "../AddressName/ContactsAddAddressName.native";
import type { ContactsAddAddressNameNativeProps } from "../AddressName/types";
import { ContactsAddAddressPlaceholderView } from "../ContactsAddAddressPlaceholderView.native";

const STEP_FRAME_HEIGHT = "100%";

export type ContactsAddAddressNativeFlowStep = "address" | "name" | "review" | "success";

export type ContactsAddAddressNativeFlowLabels = Readonly<{
  review: string;
  success: string;
  continue: string;
  done: string;
}>;

export type ContactsAddAddressFlowContentProps = Readonly<{
  step: ContactsAddAddressNativeFlowStep;
  addressEntryProps: ContactsAddAddressEntryProps | null;
  addressNameProps: ContactsAddAddressNameNativeProps | null;
  labels: ContactsAddAddressNativeFlowLabels;
  onContinueFromReview: () => void;
  onFinish: () => void;
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
  labels,
  onContinueFromReview,
  onFinish,
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
    case "review":
      return (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressPlaceholderView
            buttonLabel={labels.continue}
            onContinue={onContinueFromReview}
            testID="contacts-add-address-review-screen"
            title={labels.review}
          />
        </ContactsAddAddressStepFrame>
      );
    case "success":
      return (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressPlaceholderView
            buttonLabel={labels.done}
            onContinue={onFinish}
            testID="contacts-add-address-success-screen"
            title={labels.success}
          />
        </ContactsAddAddressStepFrame>
      );
  }
}
