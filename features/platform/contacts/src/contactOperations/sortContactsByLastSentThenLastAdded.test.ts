import { mockContact } from "@domain/entity-contact/schema.mock";
import { sortContactsByLastSentThenLastAdded } from "./sortContactsByLastSentThenLastAdded";
import type { ContactOperationsSummaries } from "./types";

const ada = mockContact({ id: "contact-ada", name: "Ada" });
const ben = mockContact({ id: "contact-ben", name: "Ben" });
const cleo = mockContact({ id: "contact-cleo", name: "Cleo" });

function idsOf(contacts: readonly { id: string }[]): string[] {
  return contacts.map(contact => contact.id);
}

describe("sortContactsByLastSentThenLastAdded", () => {
  it("orders contacts sent to before contacts never sent to", () => {
    const summaries: ContactOperationsSummaries = {
      [ben.id]: { txCount: 1, lastSentAt: 5000 },
    };

    expect(idsOf(sortContactsByLastSentThenLastAdded([ada, ben, cleo], summaries))).toEqual([
      ben.id,
      cleo.id,
      ada.id,
    ]);
  });

  it("orders contacts sent to by most recent operation first", () => {
    const summaries: ContactOperationsSummaries = {
      [ada.id]: { txCount: 1, lastSentAt: 1000 },
      [ben.id]: { txCount: 1, lastSentAt: 3000 },
      [cleo.id]: { txCount: 1, lastSentAt: 2000 },
    };

    expect(idsOf(sortContactsByLastSentThenLastAdded([ada, ben, cleo], summaries))).toEqual([
      ben.id,
      cleo.id,
      ada.id,
    ]);
  });

  it("orders never-sent contacts newest added first", () => {
    expect(idsOf(sortContactsByLastSentThenLastAdded([ada, ben, cleo], {}))).toEqual([
      cleo.id,
      ben.id,
      ada.id,
    ]);
  });
});
