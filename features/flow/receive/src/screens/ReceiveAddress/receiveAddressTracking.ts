import { track } from "@shared/analytics";

/** The properties every event of the address screen carries. */
export const RECEIVE_ADDRESS_PAGE = { page: "Receive - Confirmation", flow: "receive" } as const;

export function trackReceiveAddressButton(button: string) {
  track("button_clicked", { button, ...RECEIVE_ADDRESS_PAGE });
}
