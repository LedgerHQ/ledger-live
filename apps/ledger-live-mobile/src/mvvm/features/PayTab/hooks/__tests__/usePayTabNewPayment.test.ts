import { act, renderHook } from "@tests/test-renderer";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  mockContact,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
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

  it("should configure and open the send flow from the Pay page filtered to stablecoins", () => {
    const { result } = renderHook(() => usePayTabNewPayment());

    expect(mockUseOpenSendFlow).toHaveBeenCalledWith({
      sourceScreenName: "Pay",
      categories: [AssetCategory.Stablecoins],
    });

    act(() => result.current.open());

    expect(mockHandleOpenSendFlow).toHaveBeenCalledWith();
  });

  it("should prefill the recipient and network for a contact with one address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0];
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open(contact));

    expect(mockHandleOpenSendFlow).toHaveBeenCalledWith({
      currencyIds: [address.currencyId],
      recipient: address.address,
      skipRecipientStep: true,
    });
  });

  it.each([
    ["no address", mockContact()],
    ["multiple addresses", mockContactWithMultipleAddresses()],
  ])("should keep the account picker for a contact with %s", (_case, contact) => {
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open(contact));

    expect(mockHandleOpenSendFlow).toHaveBeenCalledWith();
  });
});
