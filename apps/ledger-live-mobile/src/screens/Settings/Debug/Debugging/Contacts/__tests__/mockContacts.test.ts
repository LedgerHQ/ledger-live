import { createContactsDebugSamples } from "../mockContacts";

describe("createContactsDebugSamples", () => {
  it("creates 25 saved contacts across the section index", () => {
    const contacts = createContactsDebugSamples();

    expect(contacts).toHaveLength(25);
    expect(contacts.every(contact => !contact.isMe)).toBe(true);
    expect(contacts.map(contact => contact.name)).toContain("\u042f\u043d\u0430");
    expect(contacts.find(contact => contact.name === "David")?.addresses).toHaveLength(3);
  });
});
