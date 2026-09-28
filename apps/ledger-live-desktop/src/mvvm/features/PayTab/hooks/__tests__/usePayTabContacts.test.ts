import { act, renderHook } from "tests/testSetup";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { usePayTabContacts } from "../usePayTabContacts";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/pay" }),
}));

const mockSelectAddress = jest.fn();

function renderContacts() {
  return renderHook(() => usePayTabContacts(mockSelectAddress));
}

describe("usePayTabContacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the picker when a contact is pressed", () => {
    const contact = mockContact({
      id: "contact-ada",
      name: "Ada",
      addresses: [mockContactAddress({ id: "address-eth", currencyId: "ethereum" })],
    });
    const { result } = renderContacts();

    act(() => result.current.contacts.onContactPress?.(contact));

    expect(result.current.contactAddressPicker.isOpen).toBe(true);
    expect(result.current.contactAddressPicker.contact).toBe(contact);
    expect(result.current.contactAddressPicker.title).toContain("Ada");
    expect(result.current.contactAddressPicker.groups.map(group => group.networkId)).toEqual([
      "ethereum",
    ]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("closes the picker on dismiss", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderContacts();

    act(() => result.current.contacts.onContactPress?.(contact));
    act(() => result.current.contactAddressPicker.onClose());

    expect(result.current.contactAddressPicker.isOpen).toBe(false);
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });

  it("pays from the selected address and closes the picker", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const address = mockContactAddress();
    const { result } = renderContacts();

    act(() => result.current.contacts.onContactPress?.(contact));
    act(() => result.current.contactAddressPicker.onSelectAddress(address));

    expect(mockSelectAddress).toHaveBeenCalledWith(address);
    expect(result.current.contactAddressPicker.isOpen).toBe(false);
  });

  it("navigates to the add-address flow", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderContacts();

    act(() => result.current.contacts.onContactPress?.(contact));
    act(() => result.current.contactAddressPicker.onAddNewAddress?.());

    expect(mockNavigate).toHaveBeenCalledWith("/contacts?contactId=contact-ada&action=add-address");
  });

  it("navigates to the contact detail", () => {
    const contact = mockContact({ id: "contact-ada", name: "Ada" });
    const { result } = renderContacts();

    act(() => result.current.contacts.onViewContact?.(contact));

    expect(mockNavigate).toHaveBeenCalledWith("/contacts?contactId=contact-ada");
  });
});
