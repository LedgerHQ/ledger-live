import React from "react";
import type { AddressBookIntentComponentProps } from "./types";
import { formatAddressBookIntentState, getAddressBookIntentTitle } from "./formatJobState";

export function AddressBookIntentComponent({ jobState }: AddressBookIntentComponentProps) {
  return (
    <section>
      <h2>{getAddressBookIntentTitle(jobState)}</h2>
      <pre>{formatAddressBookIntentState(jobState)}</pre>
    </section>
  );
}
