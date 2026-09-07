import { act, renderHook, waitFor } from "@tests/test-renderer";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useAddToExistingContactViewModel } from "../useAddToExistingContactViewModel";

const startForContact = jest.fn();
const ada = mockContact({ id: "contact-ada", name: "Ada" });
const me = mockMeContact();

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  useContacts: () => [me, ada],
  useContactsMeContact: () => me,
}));

describe("useAddToExistingContactViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startForContact.mockResolvedValue(undefined);
  });

  it("should start the name address flow after selecting a saved contact", async () => {
    const { result } = renderHook(() => useAddToExistingContactViewModel({ startForContact }));

    await act(async () => {
      result.current.onSelectContact(ada.id);
    });

    await waitFor(() => {
      expect(startForContact).toHaveBeenCalledWith(ada);
    });
  });

  it("should start the name address flow after selecting the me contact", async () => {
    const { result } = renderHook(() => useAddToExistingContactViewModel({ startForContact }));

    await act(async () => {
      result.current.onSelectContact(me.id);
    });

    await waitFor(() => {
      expect(startForContact).toHaveBeenCalledWith(me);
    });
  });
});
