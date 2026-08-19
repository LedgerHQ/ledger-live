import { CONTACTS_PAGE_EVENTS } from "@features/flow-contacts";
import { mapContactsPageEventToScreenCategory } from "./mapContactsPageEventToScreenCategory";

describe("mapContactsPageEventToScreenCategory", () => {
  it("should strip the Page prefix from contacts page events", () => {
    expect(mapContactsPageEventToScreenCategory(CONTACTS_PAGE_EVENTS.CONTACTS)).toBe("Contacts");
    expect(mapContactsPageEventToScreenCategory(CONTACTS_PAGE_EVENTS.ADD_CONTACT)).toBe(
      "Add Contact",
    );
  });

  it("should return the page name unchanged when it has no Page prefix", () => {
    expect(mapContactsPageEventToScreenCategory("Contacts" as never)).toBe("Contacts");
  });
});
