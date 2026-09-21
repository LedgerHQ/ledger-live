import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { placeMeFirst } from "./placeMeFirst";

describe("placeMeFirst", () => {
  it("puts Me ahead of the existing contact order", () => {
    const ada = mockContact({ id: "contact-ada", name: "Ada" });
    const me = mockMeContact();

    expect(placeMeFirst([ada, me]).map(contact => contact.name)).toEqual(["Me", "Ada"]);
  });

  it("leaves a list without Me unchanged", () => {
    const contacts = [mockContact({ id: "contact-ada", name: "Ada" })];

    expect(placeMeFirst(contacts)).toEqual(contacts);
  });
});
