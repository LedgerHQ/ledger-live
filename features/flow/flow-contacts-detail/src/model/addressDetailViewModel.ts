import type { ContactAddress } from "@domain/entity-contact";
import type { ContactAddressDetailPort } from "./ports";
import type { ContactAddressDetailViewModel } from "../types";

export function createContactAddressDetailViewModel(
  contactAddress: ContactAddress | undefined,
  port: ContactAddressDetailPort,
): ContactAddressDetailViewModel {
  if (contactAddress === undefined) {
    return { displayMode: "not-found" };
  }

  return {
    displayMode: "found",
    address: contactAddress.address,
    label: contactAddress.label,
    network: port.resolveNetwork(contactAddress.currencyId),
    asset: port.resolveAsset(contactAddress.currencyId),
    qrPayload: port.resolveQrPayload(contactAddress),
  };
}
