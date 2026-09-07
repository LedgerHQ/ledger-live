import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
} from "@domain/entity-contact/schema.mock";
import { summarizeContactOperationsByContact } from "./summarizeContactOperationsByContact";
import type { ContactOperation } from "./types";

const address = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";

function incoming(overrides: Partial<ContactOperation> = {}): ContactOperation {
  return {
    id: "op-in",
    type: "IN",
    senders: [address],
    date: 1000,
    currencyId: "ethereum",
    ...overrides,
  } as ContactOperation;
}

function outgoing(overrides: Partial<ContactOperation> = {}): ContactOperation {
  return {
    id: "op-out",
    type: "OUT",
    recipients: [address],
    date: 1000,
    currencyId: "ethereum",
    ...overrides,
  } as ContactOperation;
}

describe("summarizeContactOperationsByContact", () => {
  it("counts both incoming and outgoing matches", () => {
    const contact = mockContactWithAddress({ id: "contact-ada", name: "Ada" });

    const summaries = summarizeContactOperationsByContact(
      [contact],
      [incoming({ id: "in-1" }), outgoing({ id: "out-1" }), outgoing({ id: "out-2" })],
    );

    expect(summaries[contact.id].txCount).toBe(3);
  });

  it("derives lastSentAt from outgoing matches only", () => {
    const contact = mockContactWithAddress({ id: "contact-ada", name: "Ada" });

    const summaries = summarizeContactOperationsByContact(
      [contact],
      [incoming({ id: "in-late", date: 5000 }), outgoing({ id: "out-early", date: 2000 })],
    );

    expect(summaries[contact.id]).toEqual({ txCount: 2, lastSentAt: 2000 });
  });

  it("counts an incoming-only contact but leaves lastSentAt undefined", () => {
    const contact = mockContactWithAddress({ id: "contact-ada", name: "Ada" });

    const summaries = summarizeContactOperationsByContact([contact], [incoming()]);

    expect(summaries[contact.id]).toEqual({ txCount: 1 });
    expect(summaries[contact.id].lastSentAt).toBeUndefined();
  });

  it("returns a zero summary when nothing matches the contact", () => {
    const contact = mockContact({ id: "contact-ben", name: "Ben" });

    const summaries = summarizeContactOperationsByContact([contact], [outgoing()]);

    expect(summaries[contact.id]).toEqual({ txCount: 0 });
  });

  it("does not count operations on a different currency than the saved address", () => {
    const contact = mockContactWithAddress({
      id: "contact-ada",
      name: "Ada",
      addresses: [mockContactAddress({ address, currencyId: "ethereum" })],
    });

    const summaries = summarizeContactOperationsByContact(
      [contact],
      [outgoing({ currencyId: "ethereum/erc20/usd_coin" })],
    );

    expect(summaries[contact.id]).toEqual({ txCount: 0 });
  });
});
