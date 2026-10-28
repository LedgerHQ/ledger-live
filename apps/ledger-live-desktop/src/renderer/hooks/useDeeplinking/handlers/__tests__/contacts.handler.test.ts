import { contactsHandler } from "../contacts.handler";
import { createMockContext } from "./test-utils";

describe("contactsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to /contacts when lwdContacts is enabled", () => {
    const context = createMockContext({ isContactsEnabled: true });

    contactsHandler({ type: "contacts" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/contacts");
  });

  it("should navigate to home when lwdContacts is disabled", () => {
    const context = createMockContext({
      isContactsEnabled: false,
      tryRedirectToPostOnboardingOrRecover: jest.fn(() => true),
    });

    contactsHandler({ type: "contacts" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
    expect(context.tryRedirectToPostOnboardingOrRecover).not.toHaveBeenCalled();
  });
});
