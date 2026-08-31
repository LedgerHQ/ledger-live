import type { ContactOperation } from "./types";

export type ContactOperationSource = Readonly<{
  id: string;
  type: string;
  currencyId: string;
  date: Date;
  senders: readonly string[];
  recipients: readonly string[];
}>;

/** Keeps only `IN`/`OUT`; other operation types have no contact-matchable counterparty. */
export function toContactOperation(source: ContactOperationSource): ContactOperation | null {
  const base = { id: source.id, currencyId: source.currencyId, date: source.date.getTime() };

  if (source.type === "IN") {
    return { ...base, type: "IN", senders: source.senders };
  }
  if (source.type === "OUT") {
    return { ...base, type: "OUT", recipients: source.recipients };
  }
  return null;
}
