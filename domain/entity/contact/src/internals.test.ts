import { normalizeContacts } from "./internals";
import { mockContact, mockMeContact } from "./schema.mock";

describe("normalizeContacts", () => {
  it("uses the first incoming Me contact", () => {
    const incomingMe = mockMeContact({ name: "Raphael" });
    const currentMe = mockMeContact();

    expect(normalizeContacts([currentMe], [incomingMe, mockContact()], currentMe)).toEqual([
      incomingMe,
      mockContact(),
    ]);
  });

  it("preserves the current Me contact when the incoming list has none", () => {
    const currentMe = mockMeContact({ name: "Raphael" });

    expect(normalizeContacts([currentMe], [mockContact()], mockMeContact())).toEqual([
      currentMe,
      mockContact(),
    ]);
  });

  it("ignores additional incoming Me contacts", () => {
    const firstMe = mockMeContact({ name: "Raphael" });
    const secondMe = mockMeContact({ id: "contact-other-me", name: "Other" });

    expect(
      normalizeContacts([mockMeContact()], [firstMe, secondMe, mockContact()], mockMeContact()),
    ).toEqual([firstMe, mockContact()]);
  });

  it("uses the fallback Me contact when the current and incoming lists have none", () => {
    const fallbackMe = mockMeContact();

    expect(normalizeContacts([], [mockContact()], fallbackMe)).toEqual([fallbackMe, mockContact()]);
  });
});
