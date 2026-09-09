import { act, renderHook } from "@tests/test-renderer";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { NavigatorName, ScreenName } from "~/const";
import { useContactAddressPicker } from "../useContactAddressPicker";

const navigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate }),
}));

describe("useContactAddressPicker", () => {
  const contact = mockContact({
    id: "contact-ada",
    name: "Ada",
    addresses: [mockContactAddress({ id: "address-eth", currencyId: "ethereum" })],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the flow picker for a contact", () => {
    const { result } = renderHook(() => useContactAddressPicker({ onSelectAddress: jest.fn() }));

    act(() => result.current.open(contact));

    expect(result.current.contactAddressPicker.contact).toBe(contact);
    expect(result.current.contactAddressPicker.isOpen).toBe(true);
    expect(result.current.contactAddressPicker.title).toBe("Select Ada's address");
  });

  it("closes the picker then reports the selected address", () => {
    const onSelectAddress = jest.fn();
    const { result } = renderHook(() => useContactAddressPicker({ onSelectAddress }));

    act(() => result.current.open(contact));
    act(() => result.current.contactAddressPicker.onSelectAddress(contact.addresses[0]));

    expect(onSelectAddress).toHaveBeenCalledWith(contact.addresses[0]);
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });

  it("navigates to contact detail when adding an address", () => {
    const { result } = renderHook(() => useContactAddressPicker({ onSelectAddress: jest.fn() }));

    act(() => result.current.open(contact));
    act(() => result.current.contactAddressPicker.onAddNewAddress?.());

    expect(navigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContactDetail,
      params: { contactId: contact.id },
    });
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });
});
