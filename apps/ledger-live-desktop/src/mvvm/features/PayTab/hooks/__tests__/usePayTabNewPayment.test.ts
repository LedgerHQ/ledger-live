import { renderHook, act } from "tests/testSetup";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  mockContact,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { usePayTabNewPayment } from "../usePayTabNewPayment";

jest.mock("LLD/features/Send/hooks/useOpenSendFlow");

const mockOpenSendFlow = jest.fn();
const mockUseOpenSendFlow = useOpenSendFlow as jest.MockedFunction<typeof useOpenSendFlow>;

describe("usePayTabNewPayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSendFlow.mockReturnValue(mockOpenSendFlow);
  });

  it("should open the send flow from the Pay page filtered to stablecoins", () => {
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open());

    expect(mockOpenSendFlow).toHaveBeenCalledWith({
      source: "Pay",
      categories: [AssetCategory.Stablecoins],
    });
  });

  it("should prefill the recipient and network for a contact with one address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0];
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open(contact));

    expect(mockOpenSendFlow).toHaveBeenCalledWith({
      source: "Pay",
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

    expect(mockOpenSendFlow).toHaveBeenCalledWith({
      source: "Pay",
      categories: [AssetCategory.Stablecoins],
    });
  });
});
