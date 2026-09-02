import { act, renderHook } from "tests/testSetup";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { usePayTabContacts } from "../usePayTabContacts";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/pay" }),
}));

describe("usePayTabContacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the address picker with the contact when the tile is pressed", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() => usePayTabContacts());

    expect(result.current.contactAddressPicker.isOpen).toBe(false);

    act(() => result.current.contacts.onContactPress?.(contact));

    expect(result.current.contactAddressPicker.isOpen).toBe(true);
    expect(result.current.contactAddressPicker.contact).toBe(contact);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should close the address picker when it is dismissed", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() => usePayTabContacts());

    act(() => result.current.contacts.onContactPress?.(contact));
    act(() => result.current.contactAddressPicker.onClose());

    expect(result.current.contactAddressPicker.isOpen).toBe(false);
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });

  it("should keep the address picker open when an address is selected", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() => usePayTabContacts());

    act(() => result.current.contacts.onContactPress?.(contact));
    act(() => result.current.contactAddressPicker.onSelectAddress(mockContactAddress()));

    expect(result.current.contactAddressPicker.isOpen).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to the contact detail when View contact is chosen", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderHook(() => usePayTabContacts());

    act(() => result.current.contacts.onViewContact?.(contact));

    expect(mockNavigate).toHaveBeenCalledWith("/contacts?contactId=contact-ada");
  });
});
