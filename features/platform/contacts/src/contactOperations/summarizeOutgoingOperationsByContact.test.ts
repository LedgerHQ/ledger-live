import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
} from "@domain/entity-contact/schema.mock";
import { summarizeOutgoingOperationsByContact } from "./summarizeOutgoingOperationsByContact";
import type { OutgoingOperation } from "./types";

const address = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";

function operation(overrides: Partial<OutgoingOperation> = {}): OutgoingOperation {
  return {
    id: "op",
    recipientAddress: address,
    date: 1000,
    currencyId: "ethereum",
    ...overrides,
  };
}

describe("summarizeOutgoingOperationsByContact", () => {
  it("counts every matching operation and keeps the most recent date", () => {
    const contact = mockContactWithAddress({ id: "contact-ada", name: "Ada" });

    const summaries = summarizeOutgoingOperationsByContact(
      [contact],
      [
        operation({ id: "op-1", date: 1000 }),
        operation({ id: "op-2", date: 3000 }),
        operation({ id: "op-3", date: 2000 }),
      ],
    );

    expect(summaries[contact.id]).toEqual({ txCount: 3, lastSentAt: 3000 });
  });

  it("returns a zero summary and no lastSentAt when the contact was never sent to", () => {
    const contact = mockContact({ id: "contact-ben", name: "Ben" });

    const summaries = summarizeOutgoingOperationsByContact([contact], [operation()]);

    expect(summaries[contact.id]).toEqual({ txCount: 0 });
    expect(summaries[contact.id].lastSentAt).toBeUndefined();
  });

  it("does not count operations on a different currency than the saved address", () => {
    const contact = mockContactWithAddress({
      id: "contact-ada",
      name: "Ada",
      addresses: [mockContactAddress({ address, currencyId: "ethereum" })],
    });

    const summaries = summarizeOutgoingOperationsByContact(
      [contact],
      [operation({ currencyId: "ethereum/erc20/usd_coin" })],
    );

    expect(summaries[contact.id]).toEqual({ txCount: 0 });
  });
});
