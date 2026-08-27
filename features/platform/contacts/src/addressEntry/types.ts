import type { ContactAddress } from "@domain/entity-contact";

export type ContactsAddressInputMethod = "manual" | "paste" | "qr_code" | "ens";
export type ContactsAddressInputSource = Exclude<ContactsAddressInputMethod, "ens">;

export type ContactsAddressEntryState =
  | Readonly<{
      status: "empty";
      value: "";
      resolvedAddress: null;
      inputMethod: null;
    }>
  | Readonly<{
      status: "validating";
      value: string;
      resolvedAddress: null;
      inputMethod: ContactsAddressInputSource;
    }>
  | Readonly<{
      status: "valid";
      value: string;
      resolvedAddress: ContactAddress["address"];
      inputMethod: ContactsAddressInputMethod;
    }>
  | Readonly<{
      status: "invalid";
      value: string;
      resolvedAddress: null;
      inputMethod: ContactsAddressInputMethod;
      error: "invalid_format" | "domain_not_found" | "sanctioned";
    }>
  | Readonly<{
      status: "unavailable";
      value: string;
      resolvedAddress: null;
      inputMethod: ContactsAddressInputSource;
    }>;
