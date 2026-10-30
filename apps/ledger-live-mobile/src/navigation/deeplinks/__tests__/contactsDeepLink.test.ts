import { CONTACTS_DEEP_LINK, CONTACTS_DEEP_LINK_PATH } from "../contactsDeepLink";

describe("CONTACTS_DEEP_LINK", () => {
  it("should be the shared contacts deeplink", () => {
    expect(CONTACTS_DEEP_LINK).toBe("ledgerlive://contacts");
  });

  it("should be built from the path the linking config maps onto Contacts", () => {
    expect(CONTACTS_DEEP_LINK).toBe(`ledgerlive://${CONTACTS_DEEP_LINK_PATH}`);
  });
});
