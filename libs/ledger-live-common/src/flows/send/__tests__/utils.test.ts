import { getRecipientDisplayValue, getRecipientSearchPrefillValue, saveRecentSendRecipient } from "../utils";
import { getMainAccount, getRecentAddressesStore } from "../../../account/index";
import type { Transaction } from "../../../coin-modules/transaction-types";

jest.mock("../../../account/index", () => ({
  getMainAccount: jest.fn(),
  getRecentAddressesStore: jest.fn(),
}));

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetRecentAddressesStore = jest.mocked(getRecentAddressesStore);

describe("saveRecentSendRecipient", () => {
  const addAddress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRecentAddressesStore.mockReturnValue({ addAddress } as never);
    mockedGetMainAccount.mockReturnValue({
      currency: { id: "ethereum" },
    } as never);
  });

  it("should persist the recipient after broadcast", () => {
    saveRecentSendRecipient(
      { type: "Account", id: "eth-account" } as never,
      null,
      { recipient: "0xrecipient" } as Transaction,
    );

    expect(addAddress).toHaveBeenCalledWith("ethereum", "0xrecipient", undefined);
  });

  it("should prefer the flow ENS name over the transaction domain", () => {
    saveRecentSendRecipient(
      { type: "Account", id: "eth-account" } as never,
      null,
      {
        recipient: "0xrecipient",
        recipientDomain: { domain: "from-transaction.eth" },
      } as Transaction,
      "from-flow.eth",
    );

    expect(addAddress).toHaveBeenCalledWith("ethereum", "0xrecipient", "from-flow.eth");
  });

  it("should skip empty recipients", () => {
    saveRecentSendRecipient(
      { type: "Account", id: "eth-account" } as never,
      null,
      { recipient: "   " } as Transaction,
    );

    expect(addAddress).not.toHaveBeenCalled();
  });
});

describe("getRecipientDisplayValue", () => {
  it("should return empty for null recipient", () => {
    expect(getRecipientDisplayValue(null)).toBe("");
  });

  it("should return formatted address without ENS", () => {
    expect(getRecipientDisplayValue({ address: "0x1234567890abcdef" })).toBe("0x123...bcdef");
  });

  it("should use custom options for formatting", () => {
    expect(
      getRecipientDisplayValue(
        { address: "0x1234567890abcdef" },
        { prefixLength: 4, suffixLength: 4 },
      ),
    ).toBe("0x12...cdef");
  });

  it("should return ENS name with formatted address when ENS exists", () => {
    expect(
      getRecipientDisplayValue({ address: "0x1234567890abcdef", ensName: "vitalik.eth" }),
    ).toBe("vitalik.eth (0x123...bcdef)");
  });

  it("should support custom prefix/suffix length", () => {
    expect(
      getRecipientDisplayValue(
        { address: "0x1234567890abcdef" },
        { prefixLength: 4, suffixLength: 4 },
      ),
    ).toBe("0x12...cdef");
  });
});

describe("getRecipientSearchPrefillValue", () => {
  it("should return empty for null recipient", () => {
    expect(getRecipientSearchPrefillValue(null)).toBe("");
  });

  it("should return address when no ENS", () => {
    expect(getRecipientSearchPrefillValue({ address: "0x1234567890abcdef" })).toBe(
      "0x1234567890abcdef",
    );
  });

  it("should return ENS name when present", () => {
    expect(
      getRecipientSearchPrefillValue({ address: "0x1234567890abcdef", ensName: "vitalik.eth" }),
    ).toBe("vitalik.eth");
  });
});
