import { act, renderHook } from "@tests/test-renderer";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { usePayTabNewPayment } from "../usePayTabNewPayment";

jest.mock("LLM/features/Send/hooks/useOpenSendFlow");

const mockHandleOpenSendFlow = jest.fn();
const mockUseOpenSendFlow = jest.mocked(useOpenSendFlow);

describe("usePayTabNewPayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSendFlow.mockReturnValue({
      handleOpenSendFlow: mockHandleOpenSendFlow,
    });
  });

  it("should configure send from Pay", () => {
    renderHook(() => usePayTabNewPayment());

    expect(mockUseOpenSendFlow).toHaveBeenCalledWith({
      sourceScreenName: "Pay",
    });
  });

  it("should open that send flow when New is pressed without a contact", () => {
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open());

    expect(mockHandleOpenSendFlow).toHaveBeenCalledWith({
      categories: [AssetCategory.Stablecoins],
    });
  });

  it("should open the address sheet instead of send when a contact is selected", () => {
    const contact = mockContact();
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open(contact));

    expect(result.current.contactAddressPicker.contact).toBe(contact);
    expect(mockHandleOpenSendFlow).not.toHaveBeenCalled();
  });

  it("should open MAD for the selected address currency", () => {
    const address = mockContactAddress({
      currencyId: "ethereum",
      address: "0xeth",
    });
    const contact = mockContact({ addresses: [address] });
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open(contact));
    act(() => result.current.contactAddressPicker.onSelectAddress(address));

    expect(mockHandleOpenSendFlow).toHaveBeenCalledWith({
      currencyIds: ["ethereum"],
      recipient: "0xeth",
      skipRecipientStep: true,
    });
  });
});
