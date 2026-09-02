import { act, renderHook } from "tests/testSetup";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { usePayTabContacts } from "../usePayTabContacts";

const mockNavigate = jest.fn();
const mockOpenNewPayment = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/pay" }),
}));

jest.mock("../usePayTabNewPayment", () => ({
  usePayTabNewPayment: () => ({ open: mockOpenNewPayment }),
}));

describe("usePayTabContacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open send with the contact when the tile is pressed", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() => usePayTabContacts());

    act(() => result.current.contacts.onContactPress?.(contact));

    expect(mockOpenNewPayment).toHaveBeenCalledWith(contact);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to the contact detail when View contact is chosen", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() => usePayTabContacts());

    act(() => result.current.contacts.onViewContact?.(contact));

    expect(mockNavigate).toHaveBeenCalledWith("/contacts?contactId=contact-ada");
  });
});
